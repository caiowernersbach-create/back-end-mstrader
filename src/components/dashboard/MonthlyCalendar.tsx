import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface MonthlyCalendarProps {
  dailyData: Array<{
    date: string;
    dailyResult: number;
    tradesCount: number;
    isOutOfRisk: boolean;
  }>;
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

export function MonthlyCalendar({ dailyData, currentDate, onMonthChange }: MonthlyCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    dailyResult: number;
    tradesCount: number;
    isOutOfRisk: boolean;
  } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getDayStatus = (dayData: any) => {
    if (!dayData) return 'neutral';
    if (dayData.isOutOfRisk) return 'out';
    if (dayData.dailyResult > 0) return 'positive';
    if (dayData.dailyResult < 0) return 'negative';
    return 'neutral';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'positive': return 'bg-[#02AC73]/20 border-[#02AC73]';
      case 'negative': return 'bg-red-500/20 border-red-500';
      case 'out': return 'bg-red-500/30 border-red-500';
      default: return 'bg-[#2A292B] border-[#3A393B]';
    }
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'positive': return <TrendingUp className="h-3 w-3 text-[#02AC73]" />;
      case 'negative': return <TrendingDown className="h-3 w-3 text-red-400" />;
      case 'out': return <AlertTriangle className="h-3 w-3 text-red-400" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-16"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayData = dailyData.find((d: any) => 
      new Date(d.date).toDateString() === dayDate.toDateString()
    );

    const status = getDayStatus(dayData);
    const colorClass = getDayColor(status);
    const Icon = getDayIcon(status);

    days.push(
      <div 
        key={day} 
        className={`h-16 border rounded-lg p-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg cursor-pointer ${colorClass}`}
        onMouseEnter={() => dayData && setHoveredDay(dayData)}
        onMouseLeave={() => setHoveredDay(null)}
      >
        <div className="flex justify-between items-start h-full">
          <span className="text-xs font-medium text-gray-300">{day}</span>
          <div className="flex flex-col items-end gap-1">
            {Icon}
            {dayData && (
              <span className="text-xs font-semibold text-white">
                {dayData.dailyResult.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-[420px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-[#02AC73]" />
              Trading Calendar
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Daily performance and risk status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMonthChange('prev')}
              className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-white min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMonthChange('next')}
              className="text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>

        {hoveredDay && (
          <div className="absolute bg-[#1A191B] border border-[rgba(255,255,255,0.2)] rounded-lg p-3 shadow-xl z-10 backdrop-blur-sm mt-2">
            <div className="text-sm font-medium text-white mb-1">
              {new Date(hoveredDay.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge 
                variant={hoveredDay.dailyResult > 0 ? 'default' : hoveredDay.dailyResult < 0 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {hoveredDay.dailyResult.toFixed(2)}
              </Badge>
              <span className="text-gray-400">
                {hoveredDay.tradesCount} trades
              </span>
            </div>
            {hoveredDay.isOutOfRisk && (
              <div className="flex items-center gap-2 text-xs mt-1 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span>Day out of risk</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#02AC73]/20 border border-[#02AC73] rounded"></div>
            <span className="text-xs text-gray-400">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500 rounded"></div>
            <span className="text-xs text-gray-400">Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded"></div>
            <span className="text-xs text-gray-400">Out of Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#2A292B] border border-[#3A393B] rounded"></div>
            <span className="text-xs text-gray-400">No Trades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}