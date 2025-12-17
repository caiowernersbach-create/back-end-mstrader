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
    h-[100px]
    overflow-hidden
  `;

  const getGlowClass = (value: number, type: 'net' | 'win' | 'factor') => {
    if (type === 'net' && value > 0) return 'shadow-[0_0_20px_rgba(2,172,115,0.3)]';
    if (type === 'win' && value >= 50) return 'shadow-[0_0_20px_rgba(2,172,115,0.3)]';
    if (type === 'factor' && value >= 1.5) return 'shadow-[0_0_20px_rgba(2,172,115,0.3)]';
    return '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Net Result */}
      <Card className={`${getKPIClass('net')} ${getGlowClass(netResult, 'net')}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className={`text-3xl font-bold ${getKPIColor(netResult, 'net')} transition-all duration-300`}>
            {animatedValues.netResult.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
            Net Result
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className={`${getKPIClass('win')} ${getGlowClass(winRate, 'win')}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className={`text-3xl font-bold ${getKPIColor(winRate, 'win')} transition-all duration-300`}>
            {animatedValues.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
            Win Rate
          </div>
        </CardContent>
      </Card>

      {/* Profit Factor */}
      <Card className={`${getKPIClass('factor')} ${getGlowClass(profitFactor, 'factor')}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className={`text-3xl font-bold ${getKPIColor(profitFactor, 'factor')} transition-all duration-300`}>
            {animatedValues.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
            Profit Factor
          </div>
        </CardContent>
      </Card>

      {/* Total Trades */}
      <Card className={getKPIClass('trades')}>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className="text-3xl font-bold text-white transition-all duration-300">
            {animatedValues.totalTrades}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
            Total Trades
          </div>
        </CardContent>
      </Card>

      {/* Consistency Streak */}
      <Card className={getKPIClass('streak')}>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className={`text-3xl font-bold ${getKPIColor(consistencyStreak, 'streak')} transition-all duration-300`}>
            {animatedValues.consistencyStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
            Consistency
          </div>
        </CardContent>
      </Card>
    </div>
  );
}