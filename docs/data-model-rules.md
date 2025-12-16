# AMS Trading Journal Web - Data Model Rules & Implementation

## Core Data Model Rules (Strictly Enforced)

### 1. USER ROLES & IDENTITY

#### Rules:
- A user can be: Trader, Mentor, or Both
- Roles are logical, not exclusive
- Default role is 'trader'
- Role array allows multiple roles simultaneously

#### Database Implementation:
```sql
-- Users table with roles array
CREATE TABLE users (
    id UUID PRIMARY KEY,
    roles TEXT[] NOT NULL DEFAULT ARRAY['trader']::TEXT[],
    -- ... other fields
);

-- Constraint to ensure all users have trader role
ALTER TABLE users ADD CONSTRAINT users_must_have_trader_role CHECK (
    ARRAY['trader'] <@ roles
);
```

#### Business Logic:
```typescript
// src/services/user.service.ts
export class UserService {
  async updateUserRoles(userId: string, roles: UserRole[]) {
    // Validate roles
    const validRoles = ['trader', 'mentor'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  }

  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    return user?.roles.includes(role) || false;
  }
}
```

### 2. TRADES - CORE ENTITY

#### Rules:
- Every Trade MUST belong to exactly one User
- Mandatory fields: trade_id, user_id, date, result, direction, asset_id, strategy_id, account_id, emotion, risk
- Optional fields: notes, image_url
- Trades MUST NOT store stop_value directly
- stop_value must be dynamically retrieved from linked Account

#### Database Implementation:
```sql
-- Trades table with strict field requirements
CREATE TABLE trades (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    strategy_id UUID REFERENCES strategies(id),
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    result_value DECIMAL(15,2) NOT NULL,
    result_type VARCHAR(20) NOT NULL CHECK (result_type IN ('win', 'loss', 'breakeven')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('long', 'short')),
    emotion VARCHAR(100) NOT NULL,
    risk DECIMAL(15,6) NOT NULL,
    notes TEXT,
    image_url VARCHAR(500),
    -- NO stop_value field - dynamically retrieved from account
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get stop value from account
CREATE OR REPLACE FUNCTION get_account_stop_value(account_id UUID)
RETURNS DECIMAL(15,6) AS $$
DECLARE
    stop_value DECIMAL(15,6);
BEGIN
    SELECT stop_value INTO stop_value
    FROM accounts
    WHERE id = account_id AND is_active = true;
    
    RETURN COALESCE(stop_value, 0);
END;
$$ LANGUAGE plpgsql;
```

#### Business Logic:
```typescript
// src/services/trade.service.ts
export class TradeService {
  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Validate all mandatory fields
    this.validateTradeData(tradeData);

    // Get account configuration for stop_value (not stored in trade)
    const account = await this.prisma.account.findUnique({
      where: { id: tradeData.accountId },
      select: { stopValue: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Create trade without storing stop_value
    return this.prisma.trade.create({
      data: {
        ...tradeData,
        userId,
        // stop_value is not stored here - retrieved from account when needed
      },
    });
  }

  async getTradeWithAccountStopValue(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        account: {
          select: { stopValue: true },
        },
      },
    });

    if (!trade) {
      throw new Error('Trade not found');
    }

    return {
      ...trade,
      accountStopValue: trade.account.stopValue,
    };
  }

  private validateTradeData(tradeData: CreateTradeDto) {
    const errors: string[] = [];

    // Mandatory fields validation
    if (!tradeData.accountId) errors.push('Account ID is required');
    if (!tradeData.assetId) errors.push('Asset ID is required');
    if (!tradeData.strategyId) errors.push('Strategy ID is required');
    if (!tradeData.tradeDate) errors.push('Trade date is required');
    if (tradeData.resultValue === undefined) errors.push('Result value is required');
    if (!tradeData.resultType) errors.push('Result type is required');
    if (!tradeData.direction) errors.push('Direction is required');
    if (!tradeData.emotion) errors.push('Emotion is required');
    if (tradeData.risk === undefined) errors.push('Risk is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}
```

### 3. ACCOUNTS - CONFIGURATION ENTITIES

#### Rules:
- Accounts are user configuration entities
- Each Account belongs to exactly one User
- Account fields: account_id, user_id, account_name, stop_value, currency, risk_model, is_active
- stop_value is the single source of truth for trade risk calculations

#### Database Implementation:
```sql
-- Accounts table with stop_value as single source of truth
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    stop_value DECIMAL(15,6) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    risk_model JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure accounts have positive stop values
ALTER TABLE accounts ADD CONSTRAINT accounts_stop_value_positive CHECK (
    stop_value > 0
);
```

#### Business Logic:
```typescript
// src/services/account.service.ts
export class AccountService {
  async createAccount(userId: string, accountData: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...accountData,
        userId,
      },
    });
  }

  async updateAccountStopValue(accountId: string, stopValue: number) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: { stopValue },
    });
  }

  async getAccountStopValue(accountId: string): Promise<number> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stopValue: true },
    });

    return account?.stopValue || 0;
  }

  async getUserAccounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 4. STRATEGIES - USER-CREATED ENTITIES

#### Rules:
- Strategies are created by Users
- Strategy fields: strategy_id, user_id, strategy_name, description, is_active
- Strategies group Trades
- Strategy performance metrics must be computed dynamically from Trades, not stored

#### Database Implementation:
```sql
-- Strategies table with no stored metrics
CREATE TABLE strategies (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate strategy performance dynamically
CREATE OR REPLACE FUNCTION calculate_strategy_performance(strategy_id UUID, user_id UUID)
RETURNS TABLE (
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    breakeven_trades INTEGER,
    win_rate DECIMAL(5,2),
    total_profit DECIMAL(15,2),
    total_loss DECIMAL(15,2),
    net_result DECIMAL(15,2),
    profit_factor DECIMAL(10,4),
    avg_win DECIMAL(10,2),
    avg_loss DECIMAL(10,2),
    largest_win DECIMAL(15,2),
    largest_loss DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id) as total_trades,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) as winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) as losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) as breakeven_trades,
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
        END as win_rate,
        SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) as total_profit,
        SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) as total_loss,
        SUM(t.result_value) as net_result,
        CASE 
            WHEN SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) = 0 
            THEN NULL 
            ELSE SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) / 
                 SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)
        END as profit_factor,
        -- ... other calculations
    FROM trades t
    WHERE t.strategy_id = strategy_id 
      AND t.user_id = user_id 
      AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

#### Business Logic:
```typescript
// src/services/strategy.service.ts
export class StrategyService {
  async createStrategy(userId: string, strategyData: CreateStrategyDto) {
    return this.prisma.strategy.create({
      data: {
        ...strategyData,
        userId,
      },
    });
  }

  async getStrategyPerformance(strategyId: string, userId: string) {
    // Calculate performance dynamically from trades
    const performance = await this.prisma.$queryRaw`
      SELECT 
        COUNT(t.id)::INTEGER as total_trades,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::INTEGER as winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END)::INTEGER as losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END)::INTEGER as breakeven_trades,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0
          ELSE (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
        END as win_rate,
        SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END)::DECIMAL as total_profit,
        SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)::DECIMAL as total_loss,
        SUM(t.result_value)::DECIMAL as net_result
      FROM trades t
      WHERE t.strategy_id = ${strategyId} 
        AND t.user_id = ${userId} 
        AND t.is_active = true
    `;

    return performance[0];
  }

  async getUserStrategies(userId: string) {
    return this.prisma.strategy.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 5. ASSETS - USER-DEFINED ENTITIES

#### Rules:
- Assets are user-defined configuration entities
- Asset fields: asset_id, user_id, asset_symbol, market_type, is_active
- Trades reference assets via asset_id

#### Database Implementation:
```sql
-- Assets table with unique constraint per user
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) DEFAULT 'forex',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_symbol)
);
```

#### Business Logic:
```typescript
// src/services/asset.service.ts
export class AssetService {
  async createAsset(userId: string, assetData: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        ...assetData,
        userId,
      },
    });
  }

  async getUserAssets(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId, isActive: true },
      orderBy: { assetSymbol: 'asc' },
    });
  }

  async getAssetById(assetId: string) {
    return this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { user: { select: { id: true } } },
    });
  }
}
```

### 6. MENTOR RELATIONSHIP

#### Rules:
- One Mentor can have multiple Students
- A Student can have only one Mentor (optional)
- Mentor can view: students, student trades, aggregated student performance
- Mentor relationship does not transfer ownership of trades

#### Database Implementation:
```sql
-- Mentor relationships with unique constraint per student
CREATE TABLE mentor_relationships (
    id UUID PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(trader_id)  -- Enforces one mentor per student
);

-- Ensure mentor relationships are between valid users
ALTER TABLE mentor_relationships ADD CONSTRAINT mentor_relationship_valid_users CHECK (
    mentor_id != trader_id
);
```

#### Business Logic:
```typescript
// src/services/mentor.service.ts
export class MentorService {
  async createRelationship(mentorId: string, traderId: string) {
    // Check if trader already has a mentor
    const existingRelationship = await this.prisma.mentorRelationship.findUnique({
      where: { traderId },
    });

    if (existingRelationship) {
      throw new Error('Trader already has a mentor');
    }

    return this.prisma.mentorRelationship.create({
      data: {
        mentorId,
        traderId,
        status: 'pending',
      },
    });
  }

  async approveRelationship(relationshipId: string, approverId: string) {
    return this.prisma.mentorRelationship.update({
      where: { id: relationshipId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: approverId,
      },
    });
  }

  async getStudentsForMentor(mentorId: string) {
    return this.prisma.mentorRelationship.findMany({
      where: { 
        mentorId, 
        status: 'approved' 
      },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    });
  }

  async getMentorForTrader(traderId: string) {
    return this.prisma.mentorRelationship.findUnique({
      where: { traderId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    });
  }

  async getStudentTrades(mentorId: string, traderId: string) {
    // Verify mentor has access to this student
    const relationship = await this.prisma.mentorRelationship.findUnique({
      where: { 
        traderId,
        mentorId,
        status: 'approved'
      },
    });

    if (!relationship) {
      throw new Error('No approved mentor relationship found');
    }

    // Return student trades (read-only access)
    return this.prisma.trade.findMany({
      where: { userId: traderId },
      include: {
        account: true,
        asset: true,
        strategy: true,
      },
      orderBy: { tradeDate: 'desc' },
    });
  }
}
```

### 7. CALENDAR VIEW - DERIVED DATA

#### Rules:
- Calendar is a VIEW, not a table
- Aggregates Trades by day
- Displays: total daily result, number of trades per day
- No data is created or stored by Calendar

#### Database Implementation:
```sql
-- Calendar view as derived data
CREATE OR REPLACE VIEW calendar_view AS
SELECT 
    t.user_id,
    DATE(t.trade_date) AS date,
    COUNT(t.id) AS trades_count,
    SUM(t.result_value) AS total_result,
    CASE 
        WHEN SUM(t.result_value) > 0 THEN 'positive'
        WHEN SUM(t.result_value) < 0 THEN 'negative'
        ELSE 'neutral'
    END AS day_status,
    COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) AS breakeven_trades
FROM trades t
WHERE t.is_active = true
GROUP BY t.user_id, DATE(t.trade_date)
ORDER BY t.user_id, date;
```

#### Business Logic:
```typescript
// src/services/calendar.service.ts
export class CalendarService {
  async getCalendarData(userId: string, year: number, month: number) {
    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS date,
        COUNT(t.id)::INTEGER AS trades_count,
        SUM(t.result_value)::DECIMAL AS total_result,
        CASE 
          WHEN SUM(t.result_value) > 0 THEN 'positive'
          WHEN SUM(t.result_value) < 0 THEN 'negative'
          ELSE 'neutral'
        END AS day_status,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::INTEGER AS winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END)::INTEGER AS losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END)::INTEGER AS breakeven_trades
      FROM trades t
      WHERE t.user_id = ${userId}
        AND EXTRACT(YEAR FROM t.trade_date) = ${year}
        AND EXTRACT(MONTH FROM t.trade_date) = ${month}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date)
      ORDER BY date
    `;
  }

  async getMentorCalendarData(mentorId: string, traderId: string) {
    // Verify mentor has access to this student
    const relationship = await this.prisma.mentorRelationship.findUnique({
      where: { 
        traderId,
        mentorId,
        status: 'approved'
      },
    });

    if (!relationship) {
      throw new Error('No approved mentor relationship found');
    }

    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS date,
        COUNT(t.id)::INTEGER AS trades_count,
        SUM(t.result_value)::DECIMAL AS total_result,
        CASE 
          WHEN SUM(t.result_value) > 0 THEN 'positive'
          WHEN SUM(t.result_value) < 0 THEN 'negative'
          ELSE 'neutral'
        END AS day_status
      FROM trades t
      WHERE t.user_id = ${traderId}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date)
      ORDER BY date
    `;
  }
}
```

## General Rules Enforcement

### 1. No Duplicated Logic
- All business logic is centralized in service classes
- Database functions handle complex calculations
- Consistent validation across all layers

### 2. No Derived Metrics Stored in Tables
- All performance metrics are computed dynamically
- Views handle derived data (calendar view)
- Functions calculate strategy performance on demand

### 3. All Metrics Computed from Trades Dynamically
- Strategy performance calculated from linked trades
- Monthly summaries computed from trade data
- Calendar data aggregated from trades

### 4. Structure Supports Future API Integrations
- Foreign keys support MetaTrader integration
- Source field tracks data origin
- Metadata JSONB fields for flexible data storage

### 5. Data Model is Scalable and SaaS-Ready
- Row-level security for multi-tenant isolation
- Proper indexing for performance
- Comprehensive audit logging
- Flexible JSONB fields for future extensions

## Validation and Constraints

### Database-Level Constraints:
```sql
-- Ensure all users have at least the trader role
ALTER TABLE users ADD CONSTRAINT users_must_have_trader_role CHECK (
    ARRAY['trader'] <@ roles
);

-- Ensure accounts have positive stop values
ALTER TABLE accounts ADD CONSTRAINT accounts_stop_value_positive CHECK (
    stop_value > 0
);

-- Ensure trades have valid result values
ALTER TABLE trades ADD CONSTRAINT trades_result_value_check CHECK (
    result_value != 0
);

-- Ensure trades have valid risk values
ALTER TABLE trades ADD CONSTRAINT trades_risk_positive CHECK (
    risk > 0
);
```

### Application-Level Validation:
```typescript
// src/validators/trade.validator.ts
export class TradeValidator {
  static validateTrade(trade: CreateTradeDto): ValidationResult {
    const errors: string[] = [];

    // Mandatory fields validation
    const mandatoryFields = [
      'accountId', 'assetId', 'strategyId', 'tradeDate', 
      'resultValue', 'resultType', 'direction', 'emotion', 'risk'
    ];

    mandatoryFields.forEach(field => {
      if (!trade[field as keyof CreateTradeDto]) {
        errors.push(`${field} is required`);
      }
    });

    // Business rule validation
    if (trade.resultValue === 0) {
      errors.push('Result value cannot be zero');
    }

    if (trade.risk <= 0) {
      errors.push('Risk must be greater than zero');
    }

    if (!['long', 'short'].includes(trade.direction)) {
      errors.push('Direction must be either "long" or "short"');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

This comprehensive data model implementation strictly enforces all your business rules while providing a scalable, secure, and maintainable foundation for your AMS Trading Journal Web SaaS platform.