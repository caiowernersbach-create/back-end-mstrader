import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradeService } from '../services/trade.service';
import { DashboardService } from '../services/dashboard.service';
import { Trade, MonthlyMetrics, PerformanceStats } from '../types/dashboard';
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
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch all trades
  const { data: allTrades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ['trades'],
    queryFn: () => tradeService.getUserTrades('user-1'),
  });

  // Calculate monthly metrics using service
  const monthlyMetrics = DashboardService.calculateMonthlyMetrics(allTrades, currentDate);
  
  // Get monthly trades for recent trades section
  const monthlyTrades = DashboardService.getMonthlyTrades(allTrades, currentDate);
  
  // Calculate performance stats
  const performanceStats = DashboardService.getPerformanceStats(monthlyMetrics.dailyAggregations);

  useEffect(() => {
    setIsLoading(false);
  }, [allTrades, currentDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setIsLoading(true);
  };

  const handleTradeClick = (tradeId: string) => {
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
        {/* HEADER */}
        <div className={`w-full mb-12 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
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
          
          {/* Month Selector */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 bg-[#1A191B] border border-[rgba(255,255,255,0.06)] rounded-xl px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMonthChange('prev')}
                className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2 transition-all duration-200"
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
                className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2 transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI SECTION */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <MonthlyKPIs
            netResult={monthlyMetrics.netResult}
            winRate={monthlyMetrics.winRate}
            profitFactor={monthlyMetrics.profitFactor}
            totalTrades={monthlyMetrics.totalTrades}
            consistencyStreak={monthlyMetrics.consistencyStreak}
            isStreakActive={monthlyMetrics.consistencyStreak > 0}
          />
        </div>

        {/* MAIN GRID */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Equity Curve - Span 2 columns */}
          <div className="lg:col-span-2">
            <EquityCurve dailyData={monthlyMetrics.equityCurve} />
          </div>
          
          {/* Compliance Card - Span 1 column */}
          <div className="lg:col-span-1">
            <ComplianceCard
              riskManagement={monthlyMetrics.compliance.riskManagement}
              strategyAdherence={monthlyMetrics.compliance.strategyAdherence}
              entryQuality={monthlyMetrics.compliance.entryQuality}
              consistencyStreak={monthlyMetrics.consistencyStreak}
              isStreakActive={monthlyMetrics.consistencyStreak > 0}
            />
          </div>
        </div>

        {/* SECOND ROW (still main grid) */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Calendar - Span 2 columns */}
          <div className="lg:col-span-2">
            <MonthlyCalendar
              dailyData={monthlyMetrics.dailyAggregations}
              currentDate={currentDate}
              onMonthChange={handleMonthChange}
            />
          </div>
          
          {/* Empty spacer column - Span 1 column */}
          <div className="lg:col-span-1">
            {/* Reserved for future widgets */}
          </div>
        </div>

        {/* BOTTOM GRID */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Recent Trades - Span 2 columns */}
          <div className="lg:col-span-2">
            <RecentTrades
              trades={monthlyTrades}
              onTradeClick={handleTradeClick}
            />
          </div>
          
          {/* Performance Stats - Span 1 column */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-[#02AC73]" />
                  Performance Stats
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Monthly trading statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Best Day</span>
                    <span className="text-white font-semibold">
                      {performanceStats.bestDay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Worst Day</span>
                    <span className="text-white font-semibold">
                      {performanceStats.worstDay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Avg Daily Result</span>
                    <span className="text-white font-semibold">
                      {performanceStats.avgDailyResult.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Trading Days</span>
                    <span className="text-white font-semibold">
                      {performanceStats.tradingDays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}