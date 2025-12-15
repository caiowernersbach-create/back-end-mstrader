# AMS Trading Journal Web - Business Rules Implementation Guide

## Non-Negotiable Business Rules Implementation

### 1. User Roles & Identity

#### Implementation Details:
```typescript
// src/types/user.ts
export type UserRole = 'trader' | 'mentor';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[]; // Array of roles - can be both trader and mentor
  // ... other fields
}

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

  async canUserPerformAction(userId: string, requiredRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    return user?.roles.includes(requiredRole) || false;
  }
}
```

#### Database Schema Changes:
- Changed `role` from single value to `roles` array
- Default role is `['trader']`
- Users can have multiple roles simultaneously

### 2. Trade Ownership Rules

#### Implementation Details:
```typescript
// src/services/trade.service.ts
export class TradeService {
  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Verify user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Create trade with user ownership
    return this.prisma.trade.create({
      data: {
        ...tradeData,
        userId,
        // stop_value is derived from account configuration
      },
    });
  }

  async getTradesForUser(userId: string, filters?: TradeFilters) {
    return this.prisma.trade.findMany({
      where: { userId, ...filters },
      include: {
        account: true,
        asset: true,
        strategy: true,
        details: true,
      },
      orderBy: { tradeDate: 'desc' },
    });
  }
}
```

#### Database Schema Changes:
- All trades have `user_id` foreign key with ON DELETE CASCADE
- Mentors cannot own trades, only have read access to students' trades

### 3. Trade Entity (Core Entity)

#### Implementation Details:
```typescript
// src/types/trade.ts
export interface CreateTradeDto {
  // Mandatory fields
  accountId: string;
  assetId: string;
  tradeType: 'long' | 'short';
  resultValue: number;
  resultType: 'win' | 'loss' | 'breakeven';
  tradeDate: Date;
  emotion: string;
  strategyId?: string;
  
  // Optional fields
  notes?: string;
  imageUrl?: string;
  
  // Derived fields (calculated from account)
  riskRewardRatio?: number;
}

// src/services/trade.service.ts
export class TradeService {
  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Get account configuration for stop_value
    const account = await this.prisma.account.findUnique({
      where: { id: tradeData.accountId },
      select: { stopValue: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate risk_reward_ratio if not provided
    const finalTradeData = {
      ...tradeData,
      riskRewardRatio: tradeData.riskRewardRatio || this.calculateRiskRewardRatio(
        tradeData.resultValue,
        account.stopValue
      ),
    };

    return this.prisma.trade.create({
      data: finalTradeData,
    });
  }

  private calculateRiskRewardRatio(resultValue: number, stopValue: number): number {
    if (stopValue === 0) return 0;
    return Math.abs(resultValue / stopValue);
  }
}
```

#### Database Schema Changes:
- Added `account_id` and `asset_id` foreign keys
- Made `emotion` field mandatory
- Removed `stop_value` from trades (derived from account)
- Added `image_url` for optional file uploads

### 4. Configuration Tables

#### Accounts Table Implementation:
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

  async getStopValueForAccount(accountId: string): Promise<number> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stopValue: true },
    });

    return account?.stopValue || 0;
  }
}
```

#### Assets Table Implementation:
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

  async getAssetById(assetId: string) {
    return this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { user: { select: { id: true } } },
    });
  }
}
```

#### Database Schema Changes:
- Added `accounts` table with `stop_value`
- Added `assets` table with user ownership
- Both tables have proper foreign keys and RLS policies

### 5. Strategy Rules

#### Implementation Details:
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

  async getStrategyMetrics(strategyId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { strategyId },
      select: {
        resultValue: true,
        resultType: true,
        tradeDate: true,
      },
    });

    return this.calculateMetrics(trades);
  }

  private calculateMetrics(trades: Trade[]) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.resultType === 'win').length;
    const losingTrades = trades.filter(t => t.resultType === 'loss').length;
    
    const totalProfit = trades
      .filter(t => t.resultType === 'win')
      .reduce((sum, t) => sum + t.resultValue, 0);
    
    const totalLoss = trades
      .filter(t => t.resultType === 'loss')
      .reduce((sum, t) => sum + Math.abs(t.resultValue), 0);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : null,
      expectancy: totalTrades > 0 ? (totalProfit - totalLoss) / totalTrades : 0,
    };
  }
}
```

#### Database Schema Changes:
- Strategies are created by users (`user_id` foreign key)
- Trades reference strategies via `strategy_id`
- Strategy metrics are calculated from linked trades

### 6. Mentor Relationship

#### Implementation Details:
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
}
```

#### Database Schema Changes:
- `mentor_relationships` table enforces one mentor per trader (unique constraint on `trader_id`)
- Mentors can have multiple students
- Read-only access enforced via RLS policies

### 7. Calendar View (Derived View Only)

#### Implementation Details:
```typescript
// src/services/calendar.service.ts
export class CalendarService {
  async getCalendarStats(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        tradeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        tradeDate: true,
        resultValue: true,
      },
    });

    // Group by day
    const dailyStats = trades.reduce((acc, trade) => {
      const date = trade.tradeDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          tradesCount: 0,
          netResult: 0,
          totalProfit: 0,
          totalLoss: 0,
        };
      }
      acc[date].tradesCount++;
      acc[date].netResult += trade.resultValue;
      if (trade.resultValue > 0) {
        acc[date].totalProfit += trade.resultValue;
      } else {
        acc[date].totalLoss += Math.abs(trade.resultValue);
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dailyStats).map((stat: any) => ({
      ...stat,
      dayStatus: stat.netResult > 0 ? 'positive' : stat.netResult < 0 ? 'negative' : 'neutral',
      winRate: stat.tradesCount > 0 ? 
        (stat.tradesCount - (stat.totalLoss > 0 ? 1 : 0)) / stat.tradesCount * 100 : 0,
    }));
  }
}
```

#### Database Schema Changes:
- Removed `calendar_stats` table (derived view only)
- Calendar data computed dynamically from trades table
- Uses conditional color formatting based on day status

## Business Rules Validation

### Trade Validation:
```typescript
// src/validators/trade.validator.ts
export class TradeValidator {
  static validateTrade(trade: CreateTradeDto): ValidationResult {
    const errors: string[] = [];

    // Mandatory fields
    if (!trade.accountId) errors.push('Account ID is required');
    if (!trade.assetId) errors.push('Asset ID is required');
    if (!trade.tradeType) errors.push('Trade type is required');
    if (trade.resultValue === undefined) errors.push('Result value is required');
    if (!trade.resultType) errors.push('Result type is required');
    if (!trade.tradeDate) errors.push('Trade date is required');
    if (!trade.emotion) errors.push('Emotion is required');

    // Trade type validation
    if (!['long', 'short'].includes(trade.tradeType)) {
      errors.push('Trade type must be either "long" or "short"');
    }

    // Result type validation
    if (!['win', 'loss', 'breakeven'].includes(trade.resultType)) {
      errors.push('Result type must be "win", "loss", or "breakeven"');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Mentor Relationship Validation:
```typescript
// src/validators/mentor.validator.ts
export class MentorValidator {
  static async validateRelationship(mentorId: string, traderId: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if mentor exists and has mentor role
    const mentor = await this.prisma.user.findUnique({
      where: { id: mentorId },
      select: { roles: true },
    });

    if (!mentor?.roles.includes('mentor')) {
      errors.push('Mentor must have mentor role');
    }

    // Check if trader exists and has trader role
    const trader = await this.prisma.user.findUnique({
      where: { id: traderId },
      select: { roles: true },
    });

    if (!trader?.roles.includes('trader')) {
      errors.push('Trader must have trader role');
    }

    // Check if trader already has a mentor
    const existingRelationship = await this.prisma.mentorRelationship.findUnique({
      where: { traderId },
    });

    if (existingRelationship) {
      errors.push('Trader already has a mentor');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

## Security Implementation

### Mentor Access Control:
```typescript
// src/guards/mentor.guard.ts
@Injectable()
export class MentorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private mentorService: MentorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAccess = this.reflector.get<string[]>(
      'mentorAccess',
      context.getHandler(),
    );

    if (!requiredAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const traderId = request.params.traderId || request.body?.userId;
    
    if (!traderId) {
      return false;
    }

    const relationship = await this.mentorService.getMentorForTrader(traderId);
    
    return relationship?.mentorId === user.id;
  }
}
```

### Trade Ownership Guard:
```typescript
// src/guards/trade-ownership.guard.ts
@Injectable()
export class TradeOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tradeService: TradeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireOwnership = this.reflector.get<boolean>(
      'requireOwnership',
      context.getHandler(),
    );

    if (!requireOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tradeId = request.params.id;

    if (!user || !tradeId) {
      return false;
    }

    const trade = await this.tradeService.getTradeById(tradeId);
    
    return trade?.userId === user.id;
  }
}
```

This implementation guide provides comprehensive coverage of all non-negotiable business rules and domain requirements for the AMS Trading Journal Web platform.