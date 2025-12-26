import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Filter,
  TrendingUp
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getTradesByMonth } from "@/services/mockData.service";
import { TradeSlider } from "@/components/tracker/TradeSlider";

const Tracker = () => {
  const { t } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // December 2024
  const [filterStrategy, setFilterStrategy] = useState<string>("");
  const [filterEmotion, setFilterEmotion] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get trades from mock data service
  const mockTrades = getTradesByMonth(year, month);
  
  // Convert mock trades to the format used in this component
  const trades = mockTrades.map(trade => ({
    id: trade.id,
    asset: trade.asset,
    strategy_id: trade.strategyName,
    date: trade.date,
    direction: trade.direction.toLowerCase() as 'long' | 'short',
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    stop_loss: trade.stopLoss,
    quantity: trade.quantity,
    result_r: trade.resultR,
    result_value: trade.result,
    riskReward: trade.riskReward,
    emotion: trade.emotion === 'DISCIPLINED' ? 'in_control' as const : 'out_of_control' as const,
    is_out_of_risk: trade.isOutOfRisk,
    is_out_of_strategy: trade.isOutOfStrategy,
    risk_management: trade.riskManagement.toLowerCase() as 'in' | 'out',
    notes: trade.note,
    image_url: trade.imageUrl
  }));

  const filteredTrades = trades.filter(trade => {
    if (filterStrategy && !trade.strategy_id.toLowerCase().includes(filterStrategy.toLowerCase())) return false;
    if (filterEmotion && trade.emotion !== filterEmotion) return false;
    if (filterRisk) {
      if (filterRisk === 'in' && trade.risk_management !== 'in') return false;
      if (filterRisk === 'out' && trade.risk_management !== 'out') return false;
    }
    return true;
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calculate monthly stats
  const monthlyStats = {
    totalPnl: filteredTrades.reduce((sum, t) => sum + t.result_value, 0),
    totalR: filteredTrades.reduce((sum, t) => sum + t.result_r, 0),
    winRate: filteredTrades.length > 0 
      ? (filteredTrades.filter(t => t.result_r > 0).length / filteredTrades.length * 100).toFixed(0)
      : 0,
    tradesCount: filteredTrades.length,
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/50 py-16"
    >
      <div className="rounded-full bg-primary/10 p-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{t.tracker.noTrades}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t.tracker.addFirst}</p>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.tracker.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.tracker.subtitle}</p>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
            <button 
              onClick={prevMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{monthNames[month]} {year}</span>
            </div>
            <button 
              onClick={nextMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly P&L</p>
                <p className={cn(
                  "text-xl font-bold font-mono",
                  monthlyStats.totalPnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Total R</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              monthlyStats.totalR >= 0 ? "text-profit" : "text-loss"
            )}>
              {monthlyStats.totalR >= 0 ? '+' : ''}{monthlyStats.totalR.toFixed(1)}R
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold text-foreground">{monthlyStats.winRate}%</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Trades</p>
            <p className="text-xl font-bold text-foreground">{monthlyStats.tradesCount}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <select
            value={filterStrategy}
            onChange={(e) => setFilterStrategy(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">All Strategies</option>
            <option value="breakout">Breakout</option>
            <option value="pullback">Pullback</option>
            <option value="reversal">Reversal</option>
            <option value="momentum">Momentum</option>
          </select>

          <select
            value={filterEmotion}
            onChange={(e) => setFilterEmotion(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">All Emotions</option>
            <option value="in_control">In Control</option>
            <option value="out_of_control">Out of Control</option>
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">All Risk Status</option>
            <option value="in">Within Risk</option>
            <option value="out">Out of Risk</option>
          </select>
        </motion.div>

        {/* Trade Slider */}
        {filteredTrades.length > 0 ? (
          <TradeSlider trades={filteredTrades} />
        ) : (
          <EmptyState />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tracker;
