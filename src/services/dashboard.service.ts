import { Trade, DailyAggregation, MonthlyMetrics } from '../types/dashboard';

export class DashboardService {
  /**
   * Calculate monthly metrics from trades
   */
  static calculateMonthlyMetrics(
    trades: Trade[], 
    currentDate: Date
  ): MonthlyMetrics {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Filter trades for the current month
    const monthlyTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

    // Calculate basic metrics
    const totalTrades = monthlyTrades.length;
    const winningTrades = monthlyTrades.filter(trade => trade.resultType === 'win').length;
    const losingTrades = monthlyTrades.filter(trade => trade.resultType === 'loss').length;
    
    const totalProfit = monthlyTrades
      .filter(trade => trade.resultType === 'win')
      .reduce((sum, trade) => sum + trade.resultValue, 0);
    
    const totalLoss = monthlyTrades
      .filter(trade => trade.resultType === 'loss')
      .reduce((sum, trade) => sum + Math.abs(trade.resultValue), 0);
    
    const netResult = totalProfit - totalLoss;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    // Calculate daily aggregations for equity curve and calendar
    const dailyAggregations = this.calculateDailyAggregations(monthlyTrades);
    
    // Calculate equity curve data
    const equityCurve = this.calculateEquityCurve(dailyAggregations);
    
    // Calculate consistency streak
    const consistencyStreak = this.calculateConsistencyStreak(monthlyTrades, year, month);
    
    // Calculate compliance metrics (placeholder - will come from backend)
    const compliance = this.calculateComplianceMetrics(monthlyTrades);

    return {
      netResult,
      winRate,
      profitFactor,
      totalTrades,
      consistencyStreak,
      equityCurve,
      dailyAggregations,
      compliance
    };
  }

  /**
   * Calculate daily aggregations from trades
   */
  private static calculateDailyAggregations(trades: Trade[]): DailyAggregation[] {
    const dailyMap = new Map<string, DailyAggregation>();

    trades.forEach(trade => {
      const date = new Date(trade.tradeDate).toISOString().split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          dailyResult: 0,
          tradesCount: 0,
          isOutOfRisk: false
        });
      }
      
      const dayData = dailyMap.get(date)!;
      dayData.dailyResult += trade.resultValue;
      dayData.tradesCount += 1;
      
      // Use trade's isOutOfRisk flag (will come from backend)
      if (trade.isOutOfRisk) {
        dayData.isOutOfRisk = true;
      }
    });

    // Convert to array and sort by date
    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Calculate equity curve data from daily aggregations
   */
  private static calculateEquityCurve(dailyAggregations: DailyAggregation[]): Array<{
    date: string;
    equity: number;
    dailyResult: number;
    tradesCount: number;
  }> {
    let cumulativeEquity = 0;
    
    return dailyAggregations.map(day => {
      cumulativeEquity += day.dailyResult;
      return {
        date: day.date,
        equity: cumulativeEquity,
        dailyResult: day.dailyResult,
        tradesCount: day.tradesCount
      };
    });
  }

  /**
   * Calculate consistency streak (consecutive days with trades)
   */
  private static calculateConsistencyStreak(trades: Trade[], year: number, month: number): number {
    if (trades.length === 0) return 0;

    const tradeDates = trades.map(trade => 
      new Date(trade.tradeDate).toISOString().split('T')[0]
    ).sort();

    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < tradeDates.length; i++) {
      const currentDate = new Date(tradeDates[i]);
      const prevDate = new Date(tradeDates[i - 1]);
      const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  /**
   * Calculate compliance metrics (placeholder for backend integration)
   */
  private static calculateComplianceMetrics(trades: Trade[]): {
    riskManagement: number;
    strategyAdherence: number;
    entryQuality: number;
  } {
    // This will be replaced with backend calculations
    // For now, return placeholder values based on trade patterns
    const totalTrades = trades.length;
    const outOfStrategyTrades = trades.filter(trade => 
      trade.strategy?.isOutOfStrategy
    ).length;
    
    const strategyAdherence = totalTrades > 0 
      ? Math.max(0, 100 - (outOfStrategyTrades / totalTrades) * 100)
      : 0;

    // Placeholder calculations - will be replaced with backend logic
    return {
      riskManagement: Math.min(95, Math.max(60, 85 - (outOfStrategyTrades * 5))),
      strategyAdherence: Math.min(95, strategyAdherence),
      entryQuality: Math.min(95, Math.max(60, 80 - (outOfStrategyTrades * 3)))
    };
  }

  /**
   * Filter trades for current month
   */
  static getMonthlyTrades(trades: Trade[], currentDate: Date): Trade[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });
  }

  /**
   * Get best and worst days from daily aggregations
   */
  static getPerformanceStats(dailyAggregations: DailyAggregation[]): {
    bestDay: number;
    worstDay: number;
    avgDailyResult: number;
    tradingDays: number;
  } {
    if (dailyAggregations.length === 0) {
      return {
        bestDay: 0,
        worstDay: 0,
        avgDailyResult: 0,
        tradingDays: 0
      };
    }

    const dailyResults = dailyAggregations.map(d => d.dailyResult);
    const bestDay = Math.max(...dailyResults);
    const worstDay = Math.min(...dailyResults);
    const avgDailyResult = dailyResults.reduce((sum, result) => sum + result, 0) / dailyResults.length;

    return {
      bestDay,
      worstDay,
      avgDailyResult,
      tradingDays: dailyAggregations.length
    };
  }
}