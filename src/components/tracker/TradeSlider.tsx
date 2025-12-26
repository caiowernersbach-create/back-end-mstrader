import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Trade {
  id: string;
  date: string;
  asset: string;
  direction: 'long' | 'short';
  result_r: number;
  result_value: number;
  riskReward: number;
  emotion: 'in_control' | 'out_of_control';
  is_out_of_risk: boolean;
  is_out_of_strategy: boolean;
  strategy_id: string;
  notes?: string;
  image_url?: string;
}

interface TradeSliderProps {
  trades: Trade[];
  className?: string;
}

export function TradeSlider({ trades, className }: TradeSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Generate cumulative equity curve data up to current trade
  const generateEquityCurve = (upToIndex: number) => {
    let cumulative = 0;
    const data: { day: number; pnl: number; date: string }[] = [];
    
    for (let i = 0; i <= upToIndex && i < sortedTrades.length; i++) {
      cumulative += sortedTrades[i].result_value;
      const tradeDate = new Date(sortedTrades[i].date);
      data.push({
        day: tradeDate.getDate(),
        pnl: cumulative,
        date: sortedTrades[i].date,
      });
    }
    
    return data;
  };

  const equityCurve = generateEquityCurve(currentIndex);
  const currentTrade = sortedTrades[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < sortedTrades.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!currentTrade) return null;

  const isProfit = currentTrade.result_r > 0;
  const totalPnl = equityCurve[equityCurve.length - 1]?.pnl || 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Equity Curve */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Evolution</h3>
            <p className={cn(
              "text-2xl font-bold font-mono",
              totalPnl >= 0 ? "text-profit" : "text-loss"
            )}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Trade {currentIndex + 1} of {sortedTrades.length}</p>
          </div>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} 
                    stopOpacity={0.4} 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} 
                    stopOpacity={0} 
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toFixed(0)}`, "P&L"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                strokeWidth={2}
                fill="url(#pnlGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Trade Card Slider */}
      <div className="relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTrade.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Trade Image */}
              <div className="order-2 md:order-1">
                {currentTrade.image_url ? (
                  <div className="rounded-xl overflow-hidden border border-border/50 h-48">
                    <img
                      src={currentTrade.image_url}
                      alt="Trade screenshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border/50 bg-secondary/20">
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trade Details */}
              <div className="order-1 md:order-2 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      currentTrade.direction === 'long'
                        ? "bg-profit/10 text-profit"
                        : "bg-loss/10 text-loss"
                    )}>
                      {currentTrade.direction === 'long'
                        ? <ArrowUpRight className="h-6 w-6" />
                        : <ArrowDownRight className="h-6 w-6" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{currentTrade.asset}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{currentTrade.id.slice(4, 12)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-mono text-2xl font-bold",
                      isProfit ? "text-profit" : "text-loss"
                    )}>
                      {isProfit ? '+' : ''}{currentTrade.result_r.toFixed(2)}R
                    </p>
                    <p className={cn(
                      "text-sm font-mono",
                      isProfit ? "text-profit/70" : "text-loss/70"
                    )}>
                      {isProfit ? '+' : ''}${currentTrade.result_value.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Risk-Reward</p>
                    <p className="font-mono font-semibold text-foreground">
                      {currentTrade.riskReward.toFixed(1)}:1
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-mono font-semibold text-foreground">
                      {new Date(currentTrade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {/* Emotion */}
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1",
                    currentTrade.emotion === 'in_control'
                      ? "bg-profit/10 text-profit border border-profit/30"
                      : "bg-loss/10 text-loss border border-loss/30"
                  )}>
                    {currentTrade.emotion === 'in_control'
                      ? <CheckCircle className="h-3 w-3" />
                      : <XCircle className="h-3 w-3" />
                    }
                    {currentTrade.emotion === 'in_control' ? 'In Control' : 'Out of Control'}
                  </span>

                  {/* Strategy */}
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    currentTrade.is_out_of_strategy
                      ? "bg-loss/10 text-loss border border-loss/30"
                      : "bg-primary/10 text-primary border border-primary/30"
                  )}>
                    {currentTrade.is_out_of_strategy ? 'Out of Strategy' : currentTrade.strategy_id}
                  </span>

                  {/* Risk */}
                  {currentTrade.is_out_of_risk && (
                    <span className="rounded-full bg-loss/10 text-loss border border-loss/30 px-3 py-1 text-xs font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Out of Risk
                    </span>
                  )}
                </div>

                {/* Notes */}
                {currentTrade.notes && (
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{currentTrade.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "rounded-full p-3 transition-all",
              currentIndex === 0
                ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                : "bg-secondary hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {sortedTrades.slice(Math.max(0, currentIndex - 3), Math.min(sortedTrades.length, currentIndex + 4)).map((_, idx) => {
              const actualIdx = Math.max(0, currentIndex - 3) + idx;
              return (
                <button
                  key={actualIdx}
                  onClick={() => {
                    setDirection(actualIdx > currentIndex ? 1 : -1);
                    setCurrentIndex(actualIdx);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    actualIdx === currentIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-secondary hover:bg-muted-foreground"
                  )}
                />
              );
            })}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === sortedTrades.length - 1}
            className={cn(
              "rounded-full p-3 transition-all",
              currentIndex === sortedTrades.length - 1
                ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                : "bg-secondary hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
