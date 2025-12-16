import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateStrategyDto {
  userId: string;
  strategyName: string;
  description?: string;
}

export interface UpdateStrategyDto {
  strategyName?: string;
  description?: string;
}

export interface Strategy {
  id: string;
  userId: string;
  strategyName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StrategyService {
  async createStrategy(strategyData: CreateStrategyDto) {
    try {
      return prisma.strategy.create({
        data: {
          userId: strategyData.userId,
          strategyName: strategyData.strategyName,
          description: strategyData.description,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw new Error('Failed to create strategy');
    }
  }

  async getUserStrategies() {
    try {
      // In a real implementation, you would get the current user's ID
      // For now, we'll return all active strategies
      return prisma.strategy.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching user strategies:', error);
      throw new Error('Failed to fetch strategies');
    }
  }

  async getStrategyById(id: string) {
    try {
      return prisma.strategy.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching strategy:', error);
      throw new Error('Failed to fetch strategy');
    }
  }

  async updateStrategy(id: string, strategyData: UpdateStrategyDto) {
    try {
      return prisma.strategy.update({
        where: { id },
        data: strategyData,
      });
    } catch (error) {
      console.error('Error updating strategy:', error);
      throw new Error('Failed to update strategy');
    }
  }

  async deleteStrategy(id: string) {
    try {
      return prisma.strategy.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      throw new Error('Failed to delete strategy');
    }
  }

  async getStrategyPerformance(strategyId: string, userId: string) {
    try {
      return prisma.$queryRaw`
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
          SUM(t.result_value)::DECIMAL as net_result,
          CASE 
            WHEN SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) = 0 
            THEN NULL 
            ELSE SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) / 
                 SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)
          END as profit_factor
        FROM trades t
        WHERE t.strategy_id = ${strategyId} 
          AND t.user_id = ${userId} 
          AND t.is_active = true
      `;
    } catch (error) {
      console.error('Error fetching strategy performance:', error);
      throw new Error('Failed to fetch strategy performance');
    }
  }
}

export const strategyService = new StrategyService();