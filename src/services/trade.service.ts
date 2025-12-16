// Frontend API Abstraction - Mock Data
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
  // Mock data for testing
  private mockTrades = [
    {
      id: '1',
      userId: 'user-1',
      tradeDate: new Date('2024-01-15'),
      accountId: 'account-1',
      assetId: 'asset-1',
      direction: 'BUY' as const,
      resultValue: 150,
      resultType: 'win' as const,
      strategyId: 'strategy-1',
      emotion: 'Confident',
      notes: 'Good entry timing',
      tradeOutOfRisk: false,
      riskAssessment: {
        stopLossPerTrade: 100,
        dailyStopLimit: 500,
        tradeResult: 150,
        isOutOfRisk: false,
      },
      is_active: true,
      account: { id: 'account-1', accountName: 'Main Account', stopLossPerTrade: 100, dailyStopLimit: 500 },
      asset: { id: 'asset-1', assetSymbol: 'EURUSD' },
      strategy: { id: 'strategy-1', strategyName: 'Trend Following' },
    },
    {
      id: '2',
      userId: 'user-1',
      tradeDate: new Date('2024-01-14'),
      accountId: 'account-1',
      assetId: 'asset-2',
      direction: 'SELL' as const,
      resultValue: -75,
      resultType: 'loss' as const,
      strategyId: 'strategy-2',
      emotion: 'Anxious',
      notes: 'Exited too early',
      tradeOutOfRisk: false,
      riskAssessment: {
        stopLossPerTrade: 100,
        dailyStopLimit: 500,
        tradeResult: -75,
        isOutOfRisk: false,
      },
      is_active: true,
      account: { id: 'account-1', accountName: 'Main Account', stopLossPerTrade: 100, dailyStopLimit: 500 },
      asset: { id: 'asset-2', assetSymbol: 'GBPUSD' },
      strategy: { id: 'strategy-2', strategyName: 'Breakout' },
    },
  ];

  async createTrade(tradeData: CreateTradeDto) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTrade = {
          ...tradeData,
          id: `trade-${Date.now()}`,
          is_active: true,
          account: { id: tradeData.accountId, accountName: 'Mock Account' },
          asset: { id: tradeData.assetId, assetSymbol: 'Mock Asset' },
          strategy: { id: tradeData.strategyId, strategyName: 'Mock Strategy' },
        };
        this.mockTrades.push(newTrade);
        resolve(newTrade);
      }, 500); // Simulate API delay
    });
  }

  async getUserTrades(userId: string, filters?: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredTrades = this.mockTrades.filter(trade => trade.userId === userId && trade.is_active);
        
        if (filters?.accountId) {
          filteredTrades = filteredTrades.filter(trade => trade.accountId === filters.accountId);
        }
        
        if (filters?.assetId) {
          filteredTrades = filteredTrades.filter(trade => trade.assetId === filters.assetId);
        }
        
        if (filters?.strategyId) {
          filteredTrades = filteredTrades.filter(trade => trade.strategyId === filters.strategyId);
        }
        
        if (filters?.resultType) {
          filteredTrades = filteredTrades.filter(trade => trade.resultType === filters.resultType);
        }
        
        resolve(filteredTrades);
      }, 300);
    });
  }

  async getTradeById(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const trade = this.mockTrades.find(trade => trade.id === id && trade.is_active);
        resolve(trade || null);
      }, 200);
    });
  }

  async updateTrade(id: string, tradeData: Partial<CreateTradeDto>) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tradeIndex = this.mockTrades.findIndex(trade => trade.id === id);
        if (tradeIndex !== -1) {
          this.mockTrades[tradeIndex] = { ...this.mockTrades[tradeIndex], ...tradeData };
          resolve(this.mockTrades[tradeIndex]);
        } else {
          resolve(null);
        }
      }, 400);
    });
  }

  async deleteTrade(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tradeIndex = this.mockTrades.findIndex(trade => trade.id === id);
        if (tradeIndex !== -1) {
          this.mockTrades[tradeIndex].is_active = false;
          resolve(this.mockTrades[tradeIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  async getDailyRiskData(accountId: string, date: Date): Promise<DailyRiskData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: DailyRiskData[] = [
          {
            date: date.toISOString().split('T')[0],
            trades_count: 3,
            daily_result: 125.50,
            day_out_of_risk: false,
            total_profit: 200.00,
            total_loss: 74.50,
            winning_trades: 2,
            losing_trades: 1,
            breakeven_trades: 0,
            stop_loss_per_trade: 100,
            daily_stop_limit: 500,
            account_name: 'Main Account',
          },
        ];
        resolve(mockData);
      }, 250);
    });
  }

  async getMonthlyRiskData(userId: string, year: number, month: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = [
          {
            date: '2024-01-01',
            trades_count: 5,
            daily_result: 250.75,
            day_out_of_risk: false,
            stop_loss_per_trade: 100,
            daily_stop_limit: 500,
            account_name: 'Main Account',
          },
          {
            date: '2024-01-02',
            trades_count: 2,
            daily_result: -75.25,
            day_out_of_risk: false,
            stop_loss_per_trade: 100,
            daily_stop_limit: 500,
            account_name: 'Main Account',
          },
        ];
        resolve(mockData);
      }, 300);
    });
  }

  async getRiskDashboard(userId: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = [
          {
            id: 'account-1',
            account_name: 'Main Account',
            stop_loss_per_trade: 100,
            daily_stop_limit: 500,
            total_trades: 25,
            trades_out_of_risk: 2,
            days_out_of_risk: 0,
            current_streak_days: 15,
            max_streak_days: 22,
            last_risk_violation_date: null,
          },
        ];
        resolve(mockData);
      }, 400);
    });
  }
}

export const tradeService = new TradeService();