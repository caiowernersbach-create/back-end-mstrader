# AMS Trading Journal Web - Risk Management Implementation Guide

## Professional Risk Management Rules Implementation

### 1. ACCOUNTS Table Updates

#### Database Schema Changes:
```sql
-- Update ACCOUNTS table with risk management fields
ALTER TABLE accounts ADD COLUMN stop_loss_per_trade DECIMAL(15,6) NOT NULL DEFAULT 100;
ALTER TABLE accounts ADD COLUMN daily_stop_limit DECIMAL(15,6) NOT NULL DEFAULT 500;

-- Add constraints for positive values
ALTER TABLE accounts ADD CONSTRAINT accounts_stop_loss_per_trade_positive CHECK (
    stop_loss_per_trade > 0
);

ALTER TABLE accounts ADD CONSTRAINT accounts_daily_stop_limit_positive CHECK (
    daily_stop_limit > 0
);
```

#### Business Logic Implementation:
```typescript
// src/services/account.service.ts
export class AccountService {
  async createAccount(userId: string, accountData: CreateAccountDto) {
    // Validate risk management fields
    if (!accountData.stopLossPerTrade || accountData.stopLossPerTrade <= 0) {
      throw new Error('Stop loss per trade must be a positive number');
    }

    if (!accountData.dailyStopLimit || accountData.dailyStopLimit <= 0) {
      throw new Error('Daily stop limit must be a positive number');
    }

    return this.prisma.account.create({
      data: {
        ...accountData,
        userId,
      },
    });
  }

  async updateAccountRiskSettings(accountId: string, riskSettings: UpdateAccountRiskDto) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        stopLossPerTrade: riskSettings.stopLossPerTrade,
        dailyStopLimit: riskSettings.dailyStopLimit,
      },
    });
  }

  async getAccountRiskSettings(accountId: string) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        accountName: true,
        stopLossPerTrade: true,
        dailyStopLimit: true,
        currency: true,
      },
    });
  }
}
```

### 2. TRADES Rules Updates

#### Database Schema Changes:
```sql
-- Update TRADES table with risk validation fields
ALTER TABLE trades ADD COLUMN trade_out_of_risk BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN risk_assessment JSONB DEFAULT '{}';

-- Add constraint for trade result validation
ALTER TABLE trades ADD CONSTRAINT trades_result_range CHECK (
    result_value >= -999999.99 AND result_value <= 999999.99
);
```

#### Business Logic Implementation:
```typescript
// src/services/trade.service.ts
export class TradeService {
  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Validate all mandatory fields
    this.validateTradeData(tradeData);

    // Get account configuration for risk calculations
    const account = await this.prisma.account.findUnique({
      where: { id: tradeData.accountId },
      select: { 
        stopLossPerTrade: true, 
        dailyStopLimit: true,
        currency: true 
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate trade out of risk flag
    const tradeOutOfRisk = this.calculateTradeOutOfRisk(
      tradeData.resultValue,
      account.stopLossPerTrade
    );

    // Create trade with risk assessment
    return this.prisma.trade.create({
      data: {
        ...tradeData,
        userId,
        tradeOutOfRisk,
        riskAssessment: this.buildRiskAssessment(
          tradeData.resultValue,
          account.stopLossPerTrade,
          account.dailyStopLimit
        ),
      },
    });
  }

  private calculateTradeOutOfRisk(resultValue: number, stopLossPerTrade: number): boolean {
    return resultValue < -stopLossPerTrade;
  }

  private buildRiskAssessment(
    resultValue: number,
    stopLossPerTrade: number,
    dailyStopLimit: number
  ): any {
    return {
      calculatedAt: new Date(),
      stopLossPerTrade,
      dailyStopLimit,
      tradeResult: resultValue,
      isOutOfRisk: this.calculateTradeOutOfRisk(resultValue, stopLossPerTrade),
      riskLevel: this.calculateRiskLevel(resultValue, stopLossPerTrade),
    };
  }

  private calculateRiskLevel(resultValue: number, stopLossPerTrade: number): string {
    const riskRatio = Math.abs(resultValue) / stopLossPerTrade;
    
    if (riskRatio <= 0.5) return 'low';
    if (riskRatio <= 1.0) return 'medium';
    if (riskRatio <= 2.0) return 'high';
    return 'critical';
  }

  async getTradeRiskAnalysis(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        account: {
          select: {
            stopLossPerTrade: true,
            dailyStopLimit: true,
            currency: true,
          },
        },
      },
    });

    if (!trade) {
      throw new Error('Trade not found');
    }

    return {
      ...trade,
      isOutOfRisk: this.calculateTradeOutOfRisk(
        trade.resultValue,
        trade.account.stopLossPerTrade
      ),
      riskLevel: this.calculateRiskLevel(
        trade.resultValue,
        trade.account.stopLossPerTrade
      ),
    };
  }
}
```

### 3. Trade Risk Validation

#### Database Function Implementation:
```sql
-- Function to calculate trade out of risk
CREATE OR REPLACE FUNCTION calculate_trade_out_of_risk(trade_result DECIMAL, account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    stop_loss DECIMAL(15,6);
BEGIN
    SELECT stop_loss_per_trade INTO stop_loss
    FROM accounts
    WHERE id = account_id AND is_active = true;
    
    RETURN trade_result < -stop_loss;
END;
$$ LANGUAGE plpgsql;
```

#### Business Logic Implementation:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async calculateTradeRisk(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        account: true,
      },
    });

    if (!trade) {
      throw new Error('Trade not found');
    }

    const isOutOfRisk = trade.resultValue < -trade.account.stopLossPerTrade;

    return {
      tradeId,
      isOutOfRisk,
      stopLossPerTrade: trade.account.stopLossPerTrade,
      tradeResult: trade.resultValue,
      riskRatio: Math.abs(trade.resultValue) / trade.account.stopLossPerTrade,
    };
  }

  async batchUpdateTradeRiskFlags() {
    const trades = await this.prisma.trade.findMany({
      where: { is_active: true },
      include: {
        account: {
          select: { stopLossPerTrade: true },
        },
      },
    });

    const updates = trades.map(trade => ({
      id: trade.id,
      tradeOutOfRisk: trade.resultValue < -trade.account.stopLossPerTrade,
      riskAssessment: {
        calculatedAt: new Date(),
        stopLossPerTrade: trade.account.stopLossPerTrade,
        tradeResult: trade.resultValue,
        isOutOfRisk: trade.resultValue < -trade.account.stopLossPerTrade,
      },
    }));

    // Batch update
    return this.prisma.trade.updateMany({
      data: updates,
    });
  }
}
```

### 4. Daily Risk Validation

#### Database View Implementation:
```sql
-- Daily Risk View - Aggregated by user, account, and date
CREATE OR REPLACE VIEW daily_risk_view AS
SELECT 
    t.user_id,
    t.account_id,
    DATE(t.trade_date) AS trade_date,
    COUNT(t.id) AS trades_count,
    SUM(t.result_value) AS daily_result,
    CASE 
        WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true
        ELSE false
    END AS day_out_of_risk,
    SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) AS total_profit,
    SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) AS total_loss,
    COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) AS breakeven_trades,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.account_name
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.is_active = true
GROUP BY t.user_id, t.account_id, DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
ORDER BY t.user_id, t.account_id, trade_date;
```

#### Business Logic Implementation:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async getDailyRiskData(userId: string, accountId: string, date: Date) {
    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS trade_date,
        COUNT(t.id)::INTEGER AS trades_count,
        SUM(t.result_value)::DECIMAL AS daily_result,
        CASE 
          WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true
          ELSE false
        END AS day_out_of_risk,
        SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END)::DECIMAL AS total_profit,
        SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)::DECIMAL AS total_loss,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::INTEGER AS winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END)::INTEGER AS losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END)::INTEGER AS breakeven_trades,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        a.account_name
      FROM trades t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ${userId}
        AND t.account_id = ${accountId}
        AND DATE(t.trade_date) = ${date}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
    `;
  }

  async getDailyRiskTrends(userId: string, accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS trade_date,
        SUM(t.result_value)::DECIMAL AS daily_result,
        CASE 
          WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true
          ELSE false
        END AS day_out_of_risk,
        a.daily_stop_limit
      FROM trades t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ${userId}
        AND t.account_id = ${accountId}
        AND t.trade_date >= ${startDate}
        AND t.trade_date <= ${endDate}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date), a.daily_stop_limit
      ORDER BY trade_date
    `;
  }
}
```

### 5. Risk Dashboard Integration

#### Database Function Implementation:
```sql
-- Function to get user's risk dashboard data
CREATE OR REPLACE FUNCTION get_user_risk_dashboard(user_id UUID)
RETURNS TABLE (
    account_id UUID,
    account_name VARCHAR(100),
    stop_loss_per_trade DECIMAL(15,6),
    daily_stop_limit DECIMAL(15,6),
    total_trades INTEGER,
    trades_out_of_risk INTEGER,
    days_out_of_risk INTEGER,
    current_streak_days INTEGER,
    max_streak_days INTEGER,
    last_risk_violation_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.account_name,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        COUNT(t.id) as total_trades,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END) as trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = user_id AND drv.account_id = a.id AND drv.day_out_of_risk = true) as days_out_of_risk,
        -- Current streak of days within risk limits
        (SELECT COUNT(*) 
         FROM (
             SELECT DATE(trade_date) as date
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = false
             ORDER BY date DESC
             LIMIT 1
         ) as recent_risk_violation
         CROSS JOIN LATERAL (
             SELECT COUNT(*) as streak
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id 
               AND day_out_of_risk = false
               AND date > recent_risk_violation.date
             ORDER BY date ASC
         ) as streak_calc) as current_streak_days,
        -- Maximum streak of days within risk limits
        (SELECT MAX(streak_days)
         FROM (
             SELECT COUNT(*) as streak_days
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = false
             GROUP BY DATE(trade_date)
             ORDER BY streak_days DESC
             LIMIT 1
         ) as max_streak) as max_streak_days,
        -- Last risk violation date
        (SELECT MAX(trade_date)
         FROM daily_risk_view
         WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = true
         LIMIT 1) as last_risk_violation_date
    FROM accounts a
    LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
    WHERE a.user_id = user_id AND a.is_active = true
    GROUP BY a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit;
END;
$$ LANGUAGE plpgsql;
```

#### Business Logic Implementation:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async getUserRiskDashboard(userId: string) {
    return this.prisma.$queryRaw`
      SELECT 
        a.id,
        a.account_name,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        COUNT(t.id)::INTEGER as total_trades,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END)::INTEGER as trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = ${userId} AND drv.account_id = a.id AND drv.day_out_of_risk = true) as days_out_of_risk,
        -- Current streak calculation
        (SELECT COUNT(*) 
         FROM (
             SELECT DATE(trade_date) as date
             FROM daily_risk_view
             WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = false
             ORDER BY date DESC
             LIMIT 1
         ) as recent_violation
         CROSS JOIN LATERAL (
             SELECT COUNT(*) as streak
             FROM daily_risk_view
             WHERE user_id = ${userId} AND account_id = a.id 
               AND day_out_of_risk = false
               AND date > recent_violation.date
             ORDER BY date ASC
         ) as streak_calc) as current_streak_days,
        -- Last risk violation date
        (SELECT MAX(trade_date)
         FROM daily_risk_view
         WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = true
         LIMIT 1) as last_risk_violation_date
      FROM accounts a
      LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
      WHERE a.user_id = ${userId} AND a.is_active = true
      GROUP BY a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit
    `;
  }

  async getMonthlyRiskAnalysis(userId: string, year: number, month: number) {
    return this.prisma.$queryRaw`
      SELECT 
        a.id,
        a.account_name,
        COALESCE(SUM(t.result_value), 0)::DECIMAL as month_total_result,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END)::INTEGER as month_trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = ${userId} AND drv.account_id = a.id 
           AND drv.day_out_of_risk = true
           AND EXTRACT(YEAR FROM drv.trade_date) = ${year}
           AND EXTRACT(MONTH FROM drv.trade_date) = ${month}) as month_days_out_of_risk,
        CASE 
          WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
          ELSE (COUNT(DISTINCT DATE(t.trade_date)) - 
                (SELECT COUNT(*) 
                 FROM daily_risk_view drv 
                 WHERE drv.user_id = ${userId} AND drv.account_id = a.id 
                   AND drv.day_out_of_risk = true
                   AND EXTRACT(YEAR FROM drv.trade_date) = ${year}
                   AND EXTRACT(MONTH FROM drv.trade_date) = ${month}))::DECIMAL / 
               COUNT(DISTINCT DATE(t.trade_date)) * 100
        END as risk_compliance_rate,
        CASE 
          WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
          ELSE SUM(t.result_value) / COUNT(DISTINCT DATE(t.trade_date))
        END as avg_daily_result
      FROM accounts a
      LEFT JOIN trades t ON a.id = t.account_id 
        AND t.is_active = true
        AND EXTRACT(YEAR FROM t.trade_date) = ${year}
        AND EXTRACT(MONTH FROM t.trade_date) = ${month}
      WHERE a.user_id = ${userId} AND a.is_active = true
      GROUP BY a.id, a.account_name
    `;
  }
}
```

### 6. Risk Management API Endpoints

```typescript
// src/controllers/risk.controller.ts
@Controller('api/risk')
export class RiskController {
  constructor(private riskService: RiskService) {}

  @Get('dashboard/:userId')
  async getRiskDashboard(@Param('userId') userId: string) {
    return this.riskService.getUserRiskDashboard(userId);
  }

  @Get('daily-risk/:userId/:accountId/:date')
  async getDailyRisk(
    @Param('userId') userId: string,
    @Param('accountId') accountId: string,
    @Param('date') date: string
  ) {
    return this.riskService.getDailyRiskData(userId, accountId, new Date(date));
  }

  @Get('trends/:userId/:accountId')
  async getRiskTrends(
    @Param('userId') userId: string,
    @Param('accountId') accountId: string,
    @Query('days') days: number = 30
  ) {
    return this.riskService.getDailyRiskTrends(userId, accountId, days);
  }

  @Get('monthly-analysis/:userId')
  async getMonthlyAnalysis(
    @Param('userId') userId: string,
    @Query('year') year: number,
    @Query('month') month: number
  ) {
    return this.riskService.getMonthlyRiskAnalysis(userId, year, month);
  }

  @Post('update-risk-flags')
  async updateRiskFlags() {
    return this.riskService.batchUpdateTradeRiskFlags();
  }
}
```

### 7. Risk Management UI Components

```typescript
// src/components/risk/RiskDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { riskService } from '../../services/risk.service';

export function RiskDashboard({ userId }: { userId: string }) {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['risk-dashboard', userId],
    queryFn: () => riskService.getUserRiskDashboard(userId),
  });

  if (isLoading) return <div>Loading risk dashboard...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboardData?.map((account) => (
        <RiskAccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}

function RiskAccountCard({ account }: { account: any }) {
  const riskCompliance = account.total_trades > 0 
    ? ((account.total_trades - account.trades_out_of_risk) / account.total_trades) * 100 
    : 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{account.account_name}</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Stop Loss per Trade:</span>
          <span className="font-medium">{account.stop_loss_per_trade}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Daily Stop Limit:</span>
          <span className="font-medium">{account.daily_stop_limit}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Trades:</span>
          <span className="font-medium">{account.total_trades}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Trades Out of Risk:</span>
          <span className={`font-medium ${account.trades_out_of_risk > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {account.trades_out_of_risk}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Risk Compliance:</span>
          <span className={`font-medium ${riskCompliance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
            {riskCompliance.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Current Streak:</span>
          <span className="font-medium">{account.current_streak_days} days</span>
        </div>
      </div>
    </div>
  );
}
```

## Risk Management Features Summary

### 1. **Account-Level Risk Configuration**
- Mandatory `stop_loss_per_trade` and `daily_stop_limit` fields
- Positive value constraints
- User-defined risk parameters

### 2. **Trade-Level Risk Validation**
- Automatic `trade_out_of_risk` flag calculation
- Risk assessment JSON field with detailed analysis
- Real-time risk level classification

### 3. **Daily Risk Aggregation**
- No new tables required - uses computed views
- Daily result aggregation by user, account, and date
- Automatic `day_out_of_risk` flag calculation

### 4. **Comprehensive Risk Dashboard**
- Risk compliance rates
- Streak tracking (current and maximum)
- Risk violation trends
- Monthly risk analysis

### 5. **Scalable Architecture**
- Database functions for complex calculations
- Indexed views for performance
- Batch processing for risk flag updates
- User-account scoped calculations

### 6. **Integration Ready**
- Dashboard consistency tracker
- Calendar view with risk indicators
- Monthly overview with risk metrics
- Yearly analysis with trend analysis

This risk management implementation provides professional-grade risk analysis while maintaining scalability and performance for your SaaS trading journal platform.