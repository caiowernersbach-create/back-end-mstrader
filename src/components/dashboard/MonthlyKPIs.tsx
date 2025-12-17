import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Zap } from 'lucide-react';

interface MonthlyKPIsProps {
  netResult: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  consistencyStreak: number;
  isStreakActive: boolean;
}

export function MonthlyKPIs({ 
  netResult, 
  winRate, 
  profitFactor, 
  totalTrades, 
  consistencyStreak, 
  isStreakActive 
}: MonthlyKPIsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    netResult: 0,
    winRate: 0,
    profitFactor: 0,
    totalTrades: 0,
    consistencyStreak: 0,
  });

  useEffect(() => {
    const animateValue = (key: string, start: number, end: number, duration: number = 1000) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        setAnimatedValues(prev => ({
          ...prev,
          [key]: current
        }));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    animateValue('netResult', 0, netResult);
    animateValue('winRate', 0, winRate);
    animateValue('profitFactor', 0, profitFactor);
    animateValue('totalTrades', 0, totalTrades);
    animateValue('consistencyStreak', 0, consistencyStreak);
  }, [netResult, winRate, profitFactor, totalTrades, consistencyStreak]);

  const getKPIColor = (value: number, type: 'net' | 'win' | 'factor' | 'streak') => {
    switch (type) {
      case 'net':
        return value > 0 ? 'text-[#02AC73]' : value < 0 ? 'text-red-400' : 'text-yellow-400';
      case 'win':
        return value >= 50 ? 'text-[#02AC73]' : value >= 30 ? 'text-yellow-400' : 'text-red-400';
      case 'factor':
        return value >= 1.5 ? 'text-[#02AC73]' : value >= 1.0 ? 'text-yellow-400' : 'text-red-400';
      case 'streak':
        return isStreakActive ? 'text-[#02AC73]' : 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  const getKPIClass = (type: string) => `
    bg-[#1A191B] 
    border-[rgba(255,255,255,0.06)] 
    rounded-2xl 
    shadow-xl 
    hover:shadow-2xl 
    transition-all 
    duration-300 
    hover:scale-[1.01] 
    h-full
  `;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Net Result */}
      <Card className={getKPIClass('net')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Net Result</CardTitle>
          <DollarSign className="h-4 w-4 text-[#02AC73]" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getKPIColor(netResult, 'net')}`}>
            {animatedValues.netResult.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {netResult > 0 ? 'Profitable' : netResult < 0 ? 'Loss' : 'Breakeven'}
          </p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className={getKPIClass('win')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
          <Target className="h-4 w-4 text-[#02AC73]" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getKPIColor(winRate, 'win')}`}>
            {animatedValues.winRate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {winRate >= 50 ? 'Excellent' : winRate >= 30 ? 'Good' : 'Needs work'}
          </p>
        </CardContent>
      </Card>

      {/* Profit Factor */}
      <Card className={getKPIClass('factor')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Profit Factor</CardTitle>
          <TrendingUp className="h-4 w-4 text-[#02AC73]" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getKPIColor(profitFactor, 'factor')}`}>
            {animatedValues.profitFactor.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {profitFactor >= 1.5 ? 'Strong' : profitFactor >= 1.0 ? 'Positive' : 'Negative'}
          </p>
        </CardContent>
      </Card>

      {/* Total Trades */}
      <Card className={getKPIClass('trades')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Trades</CardTitle>
          <Calendar className="h-4 w-4 text-[#02AC73]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {animatedValues.totalTrades}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalTrades > 20 ? 'Active' : totalTrades > 10 ? 'Moderate' : 'Light'}
          </p>
        </CardContent>
      </Card>

      {/* Consistency Streak */}
      <Card className={getKPIClass('streak')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Consistency</CardTitle>
          <Zap className="h-4 w-4 text-[#02AC73]" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getKPIColor(consistencyStreak, 'streak')}`}>
            {animatedValues.consistencyStreak}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isStreakActive ? '🔥 Active' : '⏸️ Broken'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}