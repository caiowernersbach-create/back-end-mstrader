import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradeService } from '../services/trade.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { MonthlyKPIs } from '../components/dashboard/MonthlyKPIs';
import { EquityCurve } from '../components/dashboard/EquityCurve';
import { MonthlyCalendar } from '../components/dashboard/MonthlyCalendar';
import { ComplianceCard } from '../components/dashboard/ComplianceCard';
import { RecentTrades } from '../components/dashboard/RecentTrades';

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch trades for the current month
  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trades', currentDate],
    queryFn: () => tradeService.getUserTrades('user-1'),
  });

  // Fetch risk dashboard data
  const { data: riskData = [] } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: () => tradeService.getRiskDashboard('user-1'),
  });

  // Calculate monthly metrics
  const [monthlyMetrics, setMonthlyMetrics] = useState({
    netResult: 0,
    winRate: 0,
    profitFactor: 0,
    totalTrades: 0,
    consistencyStreak: 0,
    isStreakActive: false,
    dailyData: [] as Array<{
      date: string;
      equity: number;
      dailyResult: number;
      tradesCount: number;
    }>,
    compliance: {
      riskManagement: 0,
      strategyAdherence: 0,
      entryQuality: 0,
    }
  });

  useEffect(() => {
    if (trades.length > 0) {
      calculateMonthlyMetrics();
      setIsLoading(false);
    }
  }, [trades, currentDate]);

  const calculateMonthlyMetrics = () => {
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
    const breakevenTrades = monthlyTrades.filter(trade => trade.resultType === 'breakeven').length;
    
    const totalProfit = monthlyTrades
      .filter(trade => trade.resultType === 'win')
      .reduce((sum, trade) => sum + trade.resultValue, 0);
    
    const totalLoss = monthlyTrades
      .filter(trade => trade.resultType === 'loss')
      .reduce((sum, trade) => sum + Math.abs(trade.resultValue), 0);
    
    const netResult = totalProfit - totalLoss;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    // Calculate daily data for equity curve
    const dailyDataMap = new Map();
    let cumulativeEquity = 0;

    monthlyTrades.forEach(trade => {
      const date = new Date(trade.tradeDate).toISOString().split('T')[0];
      if (!dailyDataMap.has(date)) {
        dailyDataMap.set(date, {
          date,
          dailyResult: 0,
          tradesCount: 0,
          equity: 0
        });
      }
      
      const dayData = dailyDataMap.get(date);
      dayData.dailyResult += trade.resultValue;
      dayData.tradesCount += 1;
    });

    // Convert to array and calculate cumulative equity
    const dailyDataArray = Array.from(dailyDataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    dailyDataArray.forEach(dayData => {
      cumulativeEquity += dayData.dailyResult;
      dayData.equity = cumulativeEquity;
    });

    // Calculate consistency streak (simplified - consecutive days with trades)
    const streak = calculateConsistencyStreak(monthlyTrades, year, month);
    
    // Calculate compliance metrics (simplified for demo)
    const compliance = {
      riskManagement: Math.min(95, Math.floor(Math.random() * 30) + 70),
      strategyAdherence: Math.min(95, Math.floor(Math.random() * 25) + 70),
      entryQuality: Math.min(95, Math.floor(Math.random() * 20) + 70),
    };

    setMonthlyMetrics({
      netResult,
      winRate,
      profitFactor,
      totalTrades,
      consistencyStreak: streak,
      isStreakActive: streak > 0,
      dailyData: dailyDataArray,
      compliance
    });
  };

  const calculateConsistencyStreak = (trades: any[], year: number, month: number) => {
    if (trades.length === 0) return 0;

    const tradeDates = trades.map(trade => 
      new Date(trade.tradeDate).toISOString().split('T')[0]
    ).sort();

    let streak = 1;
    let maxStreak = 1;

    for (let i = 1; i < tradeDates.length; i++) {
      const currentDate = new Date(tradeDates[i]);
      const prevDate = new Date(tradeDates[i - 1]);
      const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }

    return maxStreak;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setIsLoading(true);
  };

  const handleTradeClick = (tradeId: string) => {
    // Future implementation for trade details
    console.log('Navigate to trade details:', tradeId);
  };

  if (isLoading || tradesLoading) {
    return (
      <div className="min-h-screen bg-[#100E0F] text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-[#02AC73] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100E0F] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#02AC73] to-[#02AC73]/60 bg-clip-text text-transparent">
                Monthly Performance
              </h1>
              <p className="text-gray-400 text-xl">
                Track your consistency, risk and execution quality
              </p>
            </div>
            <Button
              onClick={() => window.location.href = '/new-trade'}
              className="bg-gradient-to-r from-[#02AC73] to-[#02AC73]/80 hover:from-[#02AC73] hover:to-[#02AC73] text-white font-semibold rounded-xl px-8 py-4 text-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(2,172,115,0.3)]"
            >
              New Trade
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4 bg-[#1A191B] border border-[rgba(255,255,255,0.06)] rounded-xl px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('prev')}
              className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <span className="text-lg font-semibold text-white min-w-[150px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange('next')}
              className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <MonthlyKPIs
          netResult={monthlyMetrics.netResult}
          winRate={monthlyMetrics.winRate}
          profitFactor={monthlyMetrics.profitFactor}
          totalTrades={monthlyMetrics.totalTrades}
          consistencyStreak={monthlyMetrics.consistencyStreak}
          isStreakActive={monthlyMetrics.isStreakActive}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Equity Curve */}
          <EquityCurve dailyData={monthlyMetrics.dailyData} />
          
          {/* Calendar */}
          <MonthlyCalendar
            dailyData={monthlyMetrics.dailyData.map(d => ({
              date: d.date,
              dailyResult: d.dailyResult,
              tradesCount: d.tradesCount,
              day_out_of_risk: d.dailyResult < -100 // Simplified risk check
            }))}
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Compliance Card */}
        <ComplianceCard
          riskManagement={monthlyMetrics.compliance.riskManagement}
          strategyAdherence={monthlyMetrics.compliance.strategyAdherence}
          entryQuality={monthlyMetrics.compliance.entryQuality}
          consistencyStreak={monthlyMetrics.consistencyStreak}
          isStreakActive={monthlyMetrics.isStreakActive}
        />

        {/* Recent Trades */}
        <RecentTrades
          trades={trades.filter(trade => {
            const tradeDate = new Date(trade.tradeDate);
            return tradeDate.getFullYear() === currentDate.getFullYear() && 
                   tradeDate.getMonth() === currentDate.getMonth();
          })}
          onTradeClick={handleTradeClick}
        />
      </div>
    </div>
  );
}