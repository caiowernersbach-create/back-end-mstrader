import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getCalendarData, getTradesByMonth } from "@/services/mockData.service";
import { DayTradesModal } from "@/components/calendar/DayTradesModal";

const CalendarPage = () => {
  const { t } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 11, 1)); // December 2024
  const [selectedDay, setSelectedDay] = useState<{ date: string; trades: any[]; pnl: number } | null>(null);
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get calendar data and trades from mock service
  const calendarDays = getCalendarData(year, month);
  const monthTrades = getTradesByMonth(year, month);

  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarDays.find(d => d.date === dateStr);
  };

  const getDayTrades = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthTrades.filter(t => t.date.startsWith(dateStr)).map(trade => ({
      id: trade.id,
      asset: trade.asset,
      strategy_id: trade.strategyName,
      date: trade.date,
      direction: trade.direction.toLowerCase() as 'long' | 'short',
      result_r: trade.resultR,
      result_value: trade.result,
      riskReward: trade.riskReward,
      emotion: trade.emotion === 'DISCIPLINED' ? 'in_control' as const : 'out_of_control' as const,
      is_out_of_risk: trade.isOutOfRisk,
      is_out_of_strategy: trade.isOutOfStrategy,
      notes: trade.note,
      image_url: trade.imageUrl
    }));
  };

  const getDayStatus = (dayData?: typeof calendarDays[0]) => {
    if (!dayData || dayData.tradesCount === 0) return 'neutral';
    if (dayData.isOutOfRisk) return 'outOfRisk';
    if (dayData.pnl > 0) return 'positive';
    if (dayData.pnl < 0) return 'negative';
    return 'neutral';
  };

  const handleDayClick = (day: number) => {
    const dayData = getDayData(day);
    const trades = getDayTrades(day);
    if (trades.length > 0) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDay({
        date: dateStr,
        trades,
        pnl: dayData?.pnl || 0
      });
    }
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Calculate monthly stats
  const monthlyStats = {
    totalPnl: calendarDays.reduce((sum, d) => sum + d.pnl, 0),
    tradingDays: calendarDays.filter(d => d.tradesCount > 0).length,
    winDays: calendarDays.filter(d => d.pnl > 0).length,
    lossDays: calendarDays.filter(d => d.pnl < 0).length,
    consistentDays: calendarDays.filter(d => d.tradesCount > 0 && !d.isOutOfRisk && !d.isOutOfStrategy && !d.isOutOfEmotion).length,
    outOfComplianceDays: calendarDays.filter(d => d.tradesCount > 0 && (d.isOutOfRisk || d.isOutOfStrategy || d.isOutOfEmotion)).length,
  };

  // Status dots component
  const StatusDots = ({ dayData }: { dayData?: typeof calendarDays[0] }) => {
    if (!dayData || dayData.tradesCount === 0) return null;
    
    return (
      <div className="flex items-center gap-0.5 mt-0.5">
        {/* Risk dot */}
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          dayData.isOutOfRisk 
            ? "bg-loss shadow-[0_0_4px_hsl(var(--loss))]" 
            : "bg-profit shadow-[0_0_4px_hsl(var(--profit))]"
        )} title={dayData.isOutOfRisk ? "Out of Risk" : "In Risk"} />
        {/* Strategy dot */}
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          dayData.isOutOfStrategy 
            ? "bg-loss shadow-[0_0_4px_hsl(var(--loss))]" 
            : "bg-profit shadow-[0_0_4px_hsl(var(--profit))]"
        )} title={dayData.isOutOfStrategy ? "Out of Strategy" : "In Strategy"} />
        {/* Emotion dot */}
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          dayData.isOutOfEmotion 
            ? "bg-loss shadow-[0_0_4px_hsl(var(--loss))]" 
            : "bg-profit shadow-[0_0_4px_hsl(var(--profit))]"
        )} title={dayData.isOutOfEmotion ? "Out of Emotion" : "In Emotion"} />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.calendar.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.calendar.subtitle}</p>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
            <button 
              onClick={prevMonth}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {monthNames[month]} {year}
              </span>
            </div>
            <button 
              onClick={nextMonth}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-6"
        >
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Monthly P&L</p>
            </div>
            <p className={cn(
              "mt-1 text-2xl font-bold font-mono",
              monthlyStats.totalPnl >= 0 ? "text-profit" : "text-loss"
            )}>
              {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Trading Days</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{monthlyStats.tradingDays}</p>
          </div>
          <div className="rounded-2xl border border-profit/30 bg-profit/5 p-4">
            <p className="text-sm text-muted-foreground">Win Days</p>
            <p className="mt-1 text-2xl font-bold text-profit">{monthlyStats.winDays}</p>
          </div>
          <div className="rounded-2xl border border-loss/30 bg-loss/5 p-4">
            <p className="text-sm text-muted-foreground">Loss Days</p>
            <p className="mt-1 text-2xl font-bold text-loss">{monthlyStats.lossDays}</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Consistent Days</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-primary">{monthlyStats.consistentDays}</p>
          </div>
          <div className="rounded-2xl border border-neutral/30 bg-neutral/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-neutral" />
              <p className="text-sm text-muted-foreground">Out of Compliance</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-neutral">{monthlyStats.outOfComplianceDays}</p>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-background border-2 border-profit" />
            <span className="text-sm text-muted-foreground">{t.calendar.positive}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-background border-2 border-loss" />
            <span className="text-sm text-muted-foreground">{t.calendar.negative}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-loss/30 border-2 border-loss" />
            <span className="text-sm text-muted-foreground">{t.calendar.outOfRisk}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-secondary border border-border" />
            <span className="text-sm text-muted-foreground">{t.calendar.noTrades}</span>
          </div>
          {/* Status dots legend */}
          <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
            <span className="text-xs text-muted-foreground">Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-profit" />
              <span className="text-xs text-muted-foreground">Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-profit" />
              <span className="text-xs text-muted-foreground">Strategy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-profit" />
              <span className="text-xs text-muted-foreground">Emotion</span>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-6 shadow-card"
        >
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayData = getDayData(day);
              const status = getDayStatus(dayData);
              const hasTrades = dayData && dayData.tradesCount > 0;
              const hasComplianceIssue = dayData && (dayData.isOutOfRisk || dayData.isOutOfStrategy || dayData.isOutOfEmotion);
              
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.01 * day }}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative aspect-square rounded-xl p-2 transition-all duration-300 cursor-pointer overflow-hidden",
                    "bg-background/90 backdrop-blur-sm",
                    hasTrades && "hover:scale-105 hover:shadow-lg",
                    !hasTrades && "opacity-50 cursor-default",
                    // Enhanced border glow effects with stronger inner shadow
                    status === 'positive' && [
                      "border-2 border-profit",
                      "shadow-[0_0_20px_-3px_hsl(var(--profit)/0.5),inset_0_0_20px_-5px_hsl(var(--profit)/0.3)]"
                    ],
                    status === 'negative' && [
                      "border-2 border-loss",
                      "shadow-[0_0_20px_-3px_hsl(var(--loss)/0.5),inset_0_0_20px_-5px_hsl(var(--loss)/0.3)]"
                    ],
                    status === 'outOfRisk' && [
                      "border-2 border-loss bg-loss/10",
                      "shadow-[0_0_25px_-3px_hsl(var(--loss)/0.6),inset_0_0_25px_-5px_hsl(var(--loss)/0.4)]"
                    ],
                    status === 'neutral' && "border border-border/30"
                  )}
                  title={dayData ? `P&L: $${dayData.pnl}, Trades: ${dayData.tradesCount}` : t.calendar.noTrades}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    status === 'positive' && "text-profit",
                    status === 'negative' && "text-loss",
                    status === 'outOfRisk' && "text-loss",
                    status === 'neutral' && "text-muted-foreground"
                  )}>{day}</span>
                  
                  {hasTrades && (
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className={cn(
                        "text-base font-mono font-bold truncate",
                        status === 'positive' && "text-profit",
                        status === 'negative' && "text-loss",
                        status === 'outOfRisk' && "text-loss"
                      )}>
                        {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          {dayData.tradesCount} trade{dayData.tradesCount > 1 ? 's' : ''}
                        </p>
                        <StatusDots dayData={dayData} />
                      </div>
                    </div>
                  )}

                  {/* Compliance warning indicator */}
                  {hasComplianceIssue && (
                    <div className="absolute top-1.5 right-1.5">
                      <AlertTriangle className="h-3 w-3 text-loss" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Day Trades Modal */}
        {selectedDay && (
          <DayTradesModal
            isOpen={!!selectedDay}
            onClose={() => setSelectedDay(null)}
            date={selectedDay.date}
            trades={selectedDay.trades}
            totalPnl={selectedDay.pnl}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;