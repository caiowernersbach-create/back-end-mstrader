// Mock Dashboard Aggregated Data - Prepared for future backend integration

export interface MockDailyPerformance {
  date: string;
  pnl: number;
  pnlR: number;
  tradesCount: number;
  winRate: number;
  isOutOfRisk: boolean;
  isOutOfStrategy: boolean;
  isOutOfEmotion: boolean;
}

export interface MockWeeklyResult {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  resultR: number;
  gainPercent: number;
  assertiveness: number;
  tradesCount: number;
}

export interface MockMonthlyPerformance {
  month: string;
  year: number;
  totalPnl: number;
  totalR: number;
  winRate: number;
  avgR: number;
  tradesCount: number;
  consistency: number;
}

export interface MockEquityCurvePoint {
  date: string;
  cumulativePnl: number;
  cumulativeR: number;
}

// December 2024 daily performance
export const mockDecemberDailyPerformance: MockDailyPerformance[] = [
  { date: '2024-12-02', pnl: 305.00, pnlR: 1.49, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-03', pnl: 350.00, pnlR: 1.75, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-04', pnl: -195.00, pnlR: -0.98, tradesCount: 1, winRate: 0, isOutOfRisk: false, isOutOfStrategy: true, isOutOfEmotion: false },
  { date: '2024-12-05', pnl: 390.00, pnlR: 1.86, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-06', pnl: -300.00, pnlR: -1.50, tradesCount: 1, winRate: 0, isOutOfRisk: true, isOutOfStrategy: false, isOutOfEmotion: true },
  { date: '2024-12-09', pnl: 405.00, pnlR: 2.03, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-10', pnl: 150.00, pnlR: 1.00, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-11', pnl: 400.00, pnlR: 2.00, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-12', pnl: -120.00, pnlR: -1.20, tradesCount: 1, winRate: 0, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: true },
  { date: '2024-12-13', pnl: 410.00, pnlR: 2.05, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-16', pnl: 300.00, pnlR: 2.00, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-17', pnl: 300.00, pnlR: 1.50, tradesCount: 1, winRate: 100, isOutOfRisk: false, isOutOfStrategy: false, isOutOfEmotion: false },
  { date: '2024-12-18', pnl: -300.00, pnlR: -1.50, tradesCount: 1, winRate: 0, isOutOfRisk: false, isOutOfStrategy: true, isOutOfEmotion: false }
];

// Weekly results for December 2024
export const mockDecemberWeeklyResults: MockWeeklyResult[] = [
  {
    weekNumber: 49,
    weekLabel: 'Week 49',
    startDate: '2024-12-02',
    endDate: '2024-12-06',
    resultR: 2.62,
    gainPercent: 2.8,
    assertiveness: 60,
    tradesCount: 5
  },
  {
    weekNumber: 50,
    weekLabel: 'Week 50',
    startDate: '2024-12-09',
    endDate: '2024-12-13',
    resultR: 5.88,
    gainPercent: 5.2,
    assertiveness: 80,
    tradesCount: 5
  },
  {
    weekNumber: 51,
    weekLabel: 'Week 51',
    startDate: '2024-12-16',
    endDate: '2024-12-18',
    resultR: 2.00,
    gainPercent: 1.8,
    assertiveness: 67,
    tradesCount: 3
  }
];

// Monthly performance for 2024
export const mockMonthlyPerformance: MockMonthlyPerformance[] = [
  { month: 'January', year: 2024, totalPnl: 2850, totalR: 8.5, winRate: 58, avgR: 1.42, tradesCount: 18, consistency: 72 },
  { month: 'February', year: 2024, totalPnl: 3200, totalR: 10.2, winRate: 62, avgR: 1.55, tradesCount: 22, consistency: 78 },
  { month: 'March', year: 2024, totalPnl: -1200, totalR: -3.5, winRate: 45, avgR: 0.85, tradesCount: 20, consistency: 55 },
  { month: 'April', year: 2024, totalPnl: 2100, totalR: 7.0, winRate: 55, avgR: 1.30, tradesCount: 19, consistency: 68 },
  { month: 'May', year: 2024, totalPnl: 4500, totalR: 14.5, winRate: 68, avgR: 1.80, tradesCount: 25, consistency: 85 },
  { month: 'June', year: 2024, totalPnl: 1800, totalR: 6.0, winRate: 52, avgR: 1.20, tradesCount: 21, consistency: 65 },
  { month: 'July', year: 2024, totalPnl: 3800, totalR: 12.0, winRate: 65, avgR: 1.65, tradesCount: 24, consistency: 80 },
  { month: 'August', year: 2024, totalPnl: -800, totalR: -2.5, winRate: 48, avgR: 0.95, tradesCount: 18, consistency: 58 },
  { month: 'September', year: 2024, totalPnl: 2600, totalR: 8.8, winRate: 60, avgR: 1.45, tradesCount: 20, consistency: 75 },
  { month: 'October', year: 2024, totalPnl: 2650, totalR: 8.83, winRate: 62.5, avgR: 1.54, tradesCount: 8, consistency: 78 },
  { month: 'November', year: 2024, totalPnl: 2500, totalR: 10.11, winRate: 60, avgR: 1.52, tradesCount: 10, consistency: 76 },
  { month: 'December', year: 2024, totalPnl: 2095, totalR: 10.50, winRate: 69.2, avgR: 1.62, tradesCount: 13, consistency: 82 }
];

// Equity curve for 2024 (monthly cumulative)
export const mockEquityCurve: MockEquityCurvePoint[] = [
  { date: '2024-01-31', cumulativePnl: 2850, cumulativeR: 8.5 },
  { date: '2024-02-29', cumulativePnl: 6050, cumulativeR: 18.7 },
  { date: '2024-03-31', cumulativePnl: 4850, cumulativeR: 15.2 },
  { date: '2024-04-30', cumulativePnl: 6950, cumulativeR: 22.2 },
  { date: '2024-05-31', cumulativePnl: 11450, cumulativeR: 36.7 },
  { date: '2024-06-30', cumulativePnl: 13250, cumulativeR: 42.7 },
  { date: '2024-07-31', cumulativePnl: 17050, cumulativeR: 54.7 },
  { date: '2024-08-31', cumulativePnl: 16250, cumulativeR: 52.2 },
  { date: '2024-09-30', cumulativePnl: 18850, cumulativeR: 61.0 },
  { date: '2024-10-31', cumulativePnl: 21500, cumulativeR: 69.83 },
  { date: '2024-11-30', cumulativePnl: 24000, cumulativeR: 79.94 },
  { date: '2024-12-18', cumulativePnl: 26095, cumulativeR: 90.44 }
];

// December 2024 detailed equity curve (daily)
export const mockDecemberEquityCurve: MockEquityCurvePoint[] = [
  { date: '2024-12-02', cumulativePnl: 305, cumulativeR: 1.49 },
  { date: '2024-12-03', cumulativePnl: 655, cumulativeR: 3.24 },
  { date: '2024-12-04', cumulativePnl: 460, cumulativeR: 2.26 },
  { date: '2024-12-05', cumulativePnl: 850, cumulativeR: 4.12 },
  { date: '2024-12-06', cumulativePnl: 550, cumulativeR: 2.62 },
  { date: '2024-12-09', cumulativePnl: 955, cumulativeR: 4.65 },
  { date: '2024-12-10', cumulativePnl: 1105, cumulativeR: 5.65 },
  { date: '2024-12-11', cumulativePnl: 1505, cumulativeR: 7.65 },
  { date: '2024-12-12', cumulativePnl: 1385, cumulativeR: 6.45 },
  { date: '2024-12-13', cumulativePnl: 1795, cumulativeR: 8.50 },
  { date: '2024-12-16', cumulativePnl: 2095, cumulativeR: 10.50 },
  { date: '2024-12-17', cumulativePnl: 2395, cumulativeR: 12.00 },
  { date: '2024-12-18', cumulativePnl: 2095, cumulativeR: 10.50 }
];

// Consistency pillars data
export interface MockConsistencyPillar {
  name: string;
  value: number;
  color: 'green' | 'yellow' | 'red';
}

export const mockConsistencyPillars: MockConsistencyPillar[] = [
  { name: 'Risk Management', value: 85, color: 'green' },
  { name: 'Strategy Adherence', value: 92, color: 'green' },
  { name: 'Emotional Control', value: 77, color: 'yellow' }
];

// Asset performance
export interface MockAssetPerformance {
  asset: string;
  totalPnl: number;
  totalR: number;
  tradesCount: number;
  winRate: number;
}

export const mockAssetPerformance: MockAssetPerformance[] = [
  { asset: 'ES', totalPnl: 1225, totalR: 6.09, tradesCount: 6, winRate: 66.7 },
  { asset: 'NQ', totalPnl: 500, totalR: 2.75, tradesCount: 3, winRate: 66.7 },
  { asset: 'CL', totalPnl: 270, totalR: 1.86, tradesCount: 2, winRate: 50 },
  { asset: 'GC', totalPnl: 0, totalR: 0, tradesCount: 2, winRate: 50 }
];

// Weekday performance
export interface MockWeekdayPerformance {
  weekday: string;
  totalPnl: number;
  totalR: number;
  tradesCount: number;
  winRate: number;
}

export const mockWeekdayPerformance: MockWeekdayPerformance[] = [
  { weekday: 'Monday', totalPnl: 1010, totalR: 5.52, tradesCount: 3, winRate: 100 },
  { weekday: 'Tuesday', totalPnl: 650, totalR: 3.50, tradesCount: 2, winRate: 100 },
  { weekday: 'Wednesday', totalPnl: 205, totalR: 1.02, tradesCount: 2, winRate: 50 },
  { weekday: 'Thursday', totalPnl: 270, totalR: 0.66, tradesCount: 2, winRate: 50 },
  { weekday: 'Friday', totalPnl: -40, totalR: -0.20, tradesCount: 4, winRate: 50 }
];

// Strategy performance
export interface MockStrategyPerformance {
  strategyId: string;
  strategyName: string;
  totalPnl: number;
  totalR: number;
  tradesCount: number;
  winRate: number;
  avgR: number;
  status: 'active' | 'review' | 'avoid';
}

export const mockStrategyPerformance: MockStrategyPerformance[] = [
  { strategyId: 'str_breakout001', strategyName: 'Opening Range Breakout', totalPnl: 1525, totalR: 7.06, tradesCount: 5, winRate: 80, avgR: 1.77, status: 'active' },
  { strategyId: 'str_pullback002', strategyName: 'Trend Pullback', totalPnl: 800, totalR: 4.75, tradesCount: 3, winRate: 100, avgR: 1.58, status: 'active' },
  { strategyId: 'str_reversal003', strategyName: 'Support/Resistance Reversal', totalPnl: 100, totalR: 0.50, tradesCount: 2, winRate: 50, avgR: 0.25, status: 'review' },
  { strategyId: 'str_momentum004', strategyName: 'Momentum Scalp', totalPnl: 570, totalR: 2.16, tradesCount: 3, winRate: 66.7, avgR: 0.72, status: 'active' },
  { strategyId: 'str_range005', strategyName: 'Range Trading', totalPnl: -300, totalR: -1.50, tradesCount: 1, winRate: 0, avgR: -1.50, status: 'avoid' }
];

// Direction performance (for Annual dashboard)
export interface MockDirectionPerformance {
  direction: 'LONG' | 'SHORT';
  totalPnl: number;
  totalR: number;
  tradesCount: number;
  winRate: number;
}

export const mockDirectionPerformance: MockDirectionPerformance[] = [
  { direction: 'LONG', totalPnl: 2360, totalR: 12.20, tradesCount: 9, winRate: 77.8 },
  { direction: 'SHORT', totalPnl: -265, totalR: -1.70, tradesCount: 4, winRate: 50 }
];

// Annual accuracy/assertiveness
export interface MockAnnualAssertiveness {
  wins: number;
  losses: number;
  breakeven: number;
  total: number;
}

export const mockAnnualAssertiveness: MockAnnualAssertiveness = {
  wins: 9,
  losses: 4,
  breakeven: 0,
  total: 13
};
