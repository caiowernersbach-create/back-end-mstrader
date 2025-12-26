import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Target, BarChart3, Filter, ArrowRight, Plus, Layers, Percent, Award } from "lucide-react";

const strategies = [
  {
    id: "1",
    name: "Breakout",
    description: "Enter on strong breakouts with volume confirmation",
    totalTrades: 28,
    winRate: 72,
    avgRR: 2.1,
    netResult: 1250,
    trend: [12, 15, 18, 14, 22, 25, 28],
    status: "active" as const,
  },
  {
    id: "2",
    name: "Pullback",
    description: "Join trends on pullbacks to support/resistance",
    totalTrades: 22,
    winRate: 65,
    avgRR: 1.6,
    netResult: 680,
    trend: [8, 10, 12, 11, 14, 16, 18],
    status: "active" as const,
  },
  {
    id: "3",
    name: "Range Trade",
    description: "Trade reversals at established ranges",
    totalTrades: 15,
    winRate: 58,
    avgRR: 1.2,
    netResult: -120,
    trend: [5, 7, 6, 4, 5, 3, 2],
    status: "review" as const,
  },
  {
    id: "4",
    name: "Trend Follow",
    description: "Ride established trends with trailing stops",
    totalTrades: 18,
    winRate: 78,
    avgRR: 2.4,
    netResult: 920,
    trend: [10, 12, 15, 17, 19, 22, 25],
    status: "active" as const,
  },
  {
    id: "5",
    name: "Reversal",
    description: "Catch trend reversals at key levels",
    totalTrades: 12,
    winRate: 45,
    avgRR: 0.9,
    netResult: -280,
    trend: [8, 6, 5, 4, 3, 2, 1],
    status: "avoid" as const,
  },
];

const StrategyCard = ({ strategy, index, onViewDetails }: { strategy: typeof strategies[0]; index: number; onViewDetails: (id: string) => void }) => {
  const trendData = strategy.trend.map((value, i) => ({ day: i + 1, value }));
  const isProfit = strategy.netResult >= 0;
  
  const statusColors = {
    active: "bg-profit/10 text-profit border-profit/30",
    review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    avoid: "bg-loss/10 text-loss border-loss/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group cursor-pointer rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
      onClick={() => onViewDetails(strategy.id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">{strategy.name}</h3>
            <span className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              statusColors[strategy.status]
            )}>
              {strategy.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{strategy.description}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
          isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
        )}>
          {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          ${Math.abs(strategy.netResult)}
        </div>
      </div>

      {/* Mini Trend Chart */}
      <div className="my-4 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id={`trend-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isProfit ? "hsl(var(--profit))" : "hsl(var(--loss))"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isProfit ? "hsl(var(--profit))" : "hsl(var(--loss))"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isProfit ? "hsl(var(--profit))" : "hsl(var(--loss))"}
              strokeWidth={2}
              fill={`url(#trend-${strategy.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{strategy.winRate}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{strategy.avgRR}R</p>
          <p className="text-xs text-muted-foreground">Avg R:R</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-2xl font-bold",
            isProfit ? "text-profit" : "text-loss"
          )}>
            {strategy.totalTrades}
          </p>
          <p className="text-xs text-muted-foreground">Trades</p>
        </div>
      </div>

      {/* View Details CTA */}
      <div className="mt-4 flex items-center justify-end text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
        <span>View Details</span>
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
};

import { useNavigate } from "react-router-dom";

const Strategies = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "review" | "avoid">("all");
  
  const handleViewDetails = (strategyId: string) => {
    navigate(`/strategies/${strategyId}`);
  };
  
  const filteredStrategies = filter === "all" 
    ? strategies 
    : strategies.filter(s => s.status === filter);

  const bestStrategy = strategies.reduce((a, b) => a.netResult > b.netResult ? a : b);
  const worstStrategy = strategies.reduce((a, b) => a.netResult < b.netResult ? a : b);
  
  // Calculate stats
  const totalActive = strategies.filter(s => s.status === "active").length;
  const avgRR = (strategies.reduce((acc, s) => acc + s.avgRR, 0) / strategies.length).toFixed(1);
  const avgConsistency = Math.round(strategies.reduce((acc, s) => acc + s.winRate, 0) / strategies.length);
  
  // Rankings
  const mostProfitable = [...strategies].sort((a, b) => b.netResult - a.netResult).slice(0, 3);
  const leastProfitable = [...strategies].sort((a, b) => a.netResult - b.netResult).slice(0, 3);

  const hasStrategies = strategies.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.strategies.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.strategies.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Strategies</option>
                <option value="active">Active</option>
                <option value="review">Under Review</option>
                <option value="avoid">Avoid</option>
              </select>
            </div>
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              {t.strategies.addStrategy}
            </button>
          </div>
        </div>

        {hasStrategies ? (
          <>
            {/* Stats Cards Row */}
            <div className="grid gap-4 md:grid-cols-5">
              {/* Total Active */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.strategies.totalActive}</p>
                    <p className="text-2xl font-bold text-foreground">{totalActive}</p>
                  </div>
                </div>
              </motion.div>

              {/* Avg R:R */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.strategies.avgRR}</p>
                    <p className="text-2xl font-bold text-foreground">{avgRR}R</p>
                  </div>
                </div>
              </motion.div>

              {/* Strategy Consistency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.strategies.consistency}</p>
                    <p className="text-2xl font-bold text-foreground">{avgConsistency}%</p>
                  </div>
                </div>
              </motion.div>

              {/* Most Profitable Mini Ranking */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-profit/30 bg-profit/5 p-5 shadow-[0_0_20px_rgba(2,172,115,0.1)]"
              >
                <div className="flex items-center gap-2 text-profit">
                  <Award className="h-4 w-4" />
                  <p className="text-sm font-medium">{t.strategies.mostProfitable}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {mostProfitable.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{i + 1}. {s.name}</span>
                      <span className="font-mono text-profit">+${s.netResult}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Least Profitable Mini Ranking */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-loss/30 bg-loss/5 p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
              >
                <div className="flex items-center gap-2 text-loss">
                  <TrendingDown className="h-4 w-4" />
                  <p className="text-sm font-medium">{t.strategies.leastProfitable}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {leastProfitable.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{i + 1}. {s.name}</span>
                      <span className="font-mono text-loss">${s.netResult}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* What Works vs What Doesn't */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-profit/30 bg-profit/5 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-profit/20 p-2">
                    <TrendingUp className="h-5 w-5 text-profit" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-profit">{t.strategies.whatWorks}</h3>
                    <p className="text-sm text-muted-foreground">Your best performing strategy</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{bestStrategy.name}</p>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span>{bestStrategy.winRate}% win rate</span>
                    <span>{bestStrategy.avgRR}R avg</span>
                    <span className="font-semibold text-profit">+${bestStrategy.netResult}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-loss/30 bg-loss/5 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-loss/20 p-2">
                    <TrendingDown className="h-5 w-5 text-loss" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-loss">{t.strategies.needsImprovement}</h3>
                    <p className="text-sm text-muted-foreground">Review or avoid this strategy</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{worstStrategy.name}</p>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span>{worstStrategy.winRate}% win rate</span>
                    <span>{worstStrategy.avgRR}R avg</span>
                    <span className="font-semibold text-loss">-${Math.abs(worstStrategy.netResult)}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredStrategies.map((strategy, index) => (
                <StrategyCard key={strategy.id} strategy={strategy} index={index} onViewDetails={handleViewDetails} />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <Layers className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">{t.strategies.noStrategies}</h3>
            <p className="mt-2 text-muted-foreground">{t.strategies.addFirst}</p>
            <button className="btn-primary mt-6">
              <Plus className="h-4 w-4" />
              {t.strategies.addStrategy}
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Strategies;
