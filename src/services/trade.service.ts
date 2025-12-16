import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTradeDto {
  userId: string;
  tradeDate: Date;
  accountId: string;
  assetId: string;
  direction: 'BUY' | 'SELL';
  resultValue: number;
  strategyId: string;
  emotion: string;
  notes?: string;
  tradeImage?: File;
  resultType: 'win' | 'loss' | 'breakeven';
  tradeOutOfRisk: boolean;
  riskAssessment?: any;
}

export interface DailyRiskData {
  date: string;
  trades_count: number;
  daily_result: number;
  day_out_of_risk: boolean;
  total_profit: number;
  total_loss: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  stop_loss_per_trade: number;
  daily_stop_limit: number;
  account_name: string;
}

export class TradeService {
  async createTrade(tradeData: CreateTradeDto) {
    try {
      // Create trade with all required fields
      const trade = await prisma.trade.create({
        data: {
          userId: tradeData.userId,
          tradeDate: tradeData.tradeDate,
          accountId: tradeData.accountId,
          assetId: tradeData.assetId,
          direction: tradeData.direction,
          resultValue: tradeData.resultValue,
          resultType: tradeData.resultType,
          strategyId: tradeData.strategyId,
          emotion: tradeData.emotion,
          notes: tradeData.notes,
          image_url: tradeData.tradeImage ? `/uploads/trades/${Date.now()}-${tradeData.tradeImage.name}` : null,
          tradeOutOfRisk: tradeData.tradeOutOfRisk,
          riskAssessment: tradeData.riskAssessment,
          is_active: true,
        },
        include: {
          account: true,
          asset: true,
          strategy: true,
        },
      });

      // Handle image upload if provided
      if (tradeData.tradeImage) {
        // In a real implementation, you would upload to S3 or similar
        // For now, we'll just store the path
        console.log('Uploading image to:', trade.image_url);
      }

      return trade;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw new Error('Failed to create trade');
    }
  }

  async getUserTrades(userId: string, filters?: any) {
    try {
      const where: any = { userId, is_active: true };
      
      if (filters?.accountId) {
        where.accountId = filters.accountId;
      }
      
      if (filters?.assetId) {
        where.assetId = filters.assetId;
      }
      
      if (filters?.strategyId) {
        where.strategyId = filters.strategyId;
      }
      
      if (filters?.resultType) {
        where.resultType = filters.resultType;
      }
      
      if (filters?.dateFrom) {
        where.tradeDate = { gte: filters.dateFrom };
      }
      
      if (filters?.dateTo) {
        where.tradeDate = { lte: filters.dateTo };
      }

      return prisma.trade.findMany({
        where,
        include: {
          account: true,
          asset: true,
          strategy: true,
        },
        orderBy: { tradeDate: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching user trades:', error);
      throw new Error('Failed to fetch trades');
    }
  }

  async getTradeById(id: string) {
    try {
      return prisma.trade.findUnique({
        where: { id },
        include: {
          account: true,
          asset: true,
          strategy: true,
        },
      });
    } catch (error) {
      console.error('Error fetching trade:', error);
      throw new Error('Failed to fetch trade');
    }
  }

  async updateTrade(id: string, tradeData: Partial<CreateTradeDto>) {
    try {
      return prisma.trade.update({
        where: { id },
        data: tradeData,
        include: {
          account: true,
          asset: true,
          strategy: true,
        },
      });
    } catch (error) {
      console.error('Error updating trade:', error);
      throw new Error('Failed to update trade');
    }
  }

  async deleteTrade(id: string) {
    try {
      return prisma.trade.update({
        where: { id },
        data: { is_active: false },
      });
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw new Error('Failed to delete trade');
    }
  }

  async getDailyRiskData(accountId: string, date: Date): Promise<DailyRiskData[]> {
    try {
      return prisma.$queryRaw`
        SELECT 
          DATE(t.trade_date) AS date,
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
        WHERE t.account_id = ${accountId}
          AND DATE(t.trade_date) = ${date}
          AND t.is_active = true
        GROUP BY DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
      ` as DailyRiskData[];
    } catch (error) {
      console.error('Error fetching daily risk data:', error);
      throw new Error('Failed to fetch daily risk data');
    }
  }

  async getMonthlyRiskData(userId: string, year: number, month: number) {
    try {
      return prisma.$queryRaw`
        SELECT 
          DATE(t.trade_date) AS date,
          COUNT(t.id)::INTEGER AS trades_count,
          SUM(t.result_value)::DECIMAL AS daily_result,
          CASE 
            WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true
            ELSE false
          END AS day_out_of_risk,
          a.stop_loss_per_trade,
          a.daily_stop_limit,
          a.account_name
        FROM trades t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = ${userId}
          AND EXTRACT(YEAR FROM t.trade_date) = ${year}
          AND EXTRACT(MONTH FROM t.trade_date) = ${month}
          AND t.is_active = true
        GROUP BY DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
        ORDER BY date
      `;
    } catch (error) {
      console.error('Error fetching monthly risk data:', error);
      throw new Error('Failed to fetch monthly risk data');
    }
  }

  async getRiskDashboard(userId: string) {
    try {
      return prisma.$queryRaw`
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
          (SELECT MAX(streak_days)
           FROM (
               SELECT COUNT(*) as streak_days
               FROM daily_risk_view
               WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = false
               GROUP BY DATE(trade_date)
               ORDER BY streak_days DESC
               LIMIT 1
           ) as max_streak) as max_streak_days,
          (SELECT MAX(trade_date)
           FROM daily_risk_view
           WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = true
           LIMIT 1) as last_risk_violation_date
        FROM accounts a
        LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
        WHERE a.user_id = ${userId} AND a.is_active = true
        GROUP BY a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit
      `;
    } catch (error) {
      console.error('Error fetching risk dashboard:', error);
      throw new Error('Failed to fetch risk dashboard');
    }
  }
}

export const tradeService = new TradeService();