export interface Strategy {
  id: string;
  userId: string;
  strategyName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStrategyDto {
  userId: string;
  strategyName: string;
  description?: string;
}

export interface UpdateStrategyDto {
  strategyName?: string;
  description?: string;
}

export interface StrategyPerformance {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  win_rate: number;
  total_profit: number;
  total_loss: number;
  net_result: number;
  profit_factor: number;
}

export class StrategyService {
  private mockStrategies: Strategy[] = [
    {
      id: 'strategy-1',
      userId: 'user-1',
      strategyName: 'Trend Following',
      description: 'Follow market trends with moving averages',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'strategy-2',
      userId: 'user-1',
      strategyName: 'Breakout',
      description: 'Trade breakouts of key levels',
      isActive: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'strategy-3',
      userId: 'user-1',
      strategyName: 'Mean Reversion',
      description: 'Trade back to average prices',
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
    },
  ];

  async createStrategy(strategyData: CreateStrategyDto): Promise<Strategy> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newStrategy: Strategy = {
          ...strategyData,
          id: `strategy-${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockStrategies.push(newStrategy);
        resolve(newStrategy);
      }, 500);
    });
  }

  async getUserStrategies(): Promise<Strategy[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activeStrategies = this.mockStrategies.filter(strategy => strategy.isActive);
        resolve(activeStrategies);
      }, 300);
    });
  }

  async getStrategyById(id: string): Promise<Strategy | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const strategy = this.mockStrategies.find(strategy => strategy.id === id && strategy.isActive);
        resolve(strategy || null);
      }, 200);
    });
  }

  async updateStrategy(id: string, strategyData: UpdateStrategyDto): Promise<Strategy | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const strategyIndex = this.mockStrategies.findIndex(strategy => strategy.id === id);
        if (strategyIndex !== -1) {
          this.mockStrategies[strategyIndex] = {
            ...this.mockStrategies[strategyIndex],
            ...strategyData,
            updatedAt: new Date(),
          };
          resolve(this.mockStrategies[strategyIndex]);
        } else {
          resolve(null);
        }
      }, 400);
    });
  }

  async deleteStrategy(id: string): Promise<Strategy | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const strategyIndex = this.mockStrategies.findIndex(strategy => strategy.id === id);
        if (strategyIndex !== -1) {
          this.mockStrategies[strategyIndex].isActive = false;
          this.mockStrategies[strategyIndex].updatedAt = new Date();
          resolve(this.mockStrategies[strategyIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  async getStrategyPerformance(strategyId: string, userId: string): Promise<StrategyPerformance> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPerformance: StrategyPerformance = {
          total_trades: 15,
          winning_trades: 10,
          losing_trades: 4,
          breakeven_trades: 1,
          win_rate: 66.67,
          total_profit: 750.50,
          total_loss: 225.25,
          net_result: 525.25,
          profit_factor: 3.33,
        };
        resolve(mockPerformance);
      }, 400);
    });
  }
}

export const strategyService = new StrategyService();