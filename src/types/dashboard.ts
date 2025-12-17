export interface Trade {
  id: string;
  tradeDate: Date;
  resultValue: number;
  resultType: 'win' | 'loss' | 'breakeven';
  direction: 'BUY' | 'SELL';
  emotion: string;
  strategy: {
    id: string;
    strategyName: string;
    isOutOfStrategy?: boolean;
  };
  asset: {
    assetSymbol: string;
  };
  account: {
    id: string;
  };
  isOutOfRisk: boolean;
}

export interface DailyAggregation {
  date: string;
  dailyResult: number;
  tradesCount: number;
  isOutOfRisk: boolean;
}

export interface MonthlyMetrics {
  netResult: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  consistencyStreak: number;
  equityCurve: Array<{
    date: string;
    equity: number;
    dailyResult: number;
    tradesCount: number;
  }>;
  dailyAggregations: DailyAggregation[];
  compliance: {
    riskManagement: number;
    strategyAdherence: number;
    entryQuality: number;
  };
}

export interface PerformanceStats {
  bestDay: number;
  worstDay: number;
  avgDailyResult: number;
  tradingDays: number;
}