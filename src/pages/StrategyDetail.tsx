import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Calendar,
  Percent,
  Award
} from "lucide-react";
import { getUserStrategies } from "@/services/mockData.service";

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useApp();
  
  // Get strategy from mock data
  const strategies = getUserStrategies();
  const strategy = strategies.find(s => s.id === id);
  
  if (!strategy) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">{t.strategies.noStrategies}</p>
          <button onClick={() => navigate('/strategies')} className="btn-primary mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Strategies
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Mock performance data for this strategy
  const monthlyPerformance = [
    { month: 'Jul', pnl: 450, trades: 5 },
    { month: 'Aug', pnl: -120, trades: 4 },
    { month: 'Sep', pnl: 680, trades: 7 },
    { month: 'Oct', pnl: 320, trades: 6 },
    { month: 'Nov', pnl: 890, trades: 8 },
    { month: 'Dec', pnl: 540, trades: 6 },
  ];

  const equityCurve = [
    { day: 1, equity: 0 },
    { day: 5, equity: 150 },
    { day: 10, equity: 280 },
    { day: 15, equity: 420 },
    { day: 20, equity: 380 },
    { day: 25, equity: 550 },
    { day: 30, equity: 720 },
  ];

  const recentTrades = [
    { id: '1', date: '2024-12-18', asset: 'ES', direction: 'LONG', resultR: 1.5, result: 150 },
    { id: '2', date: '2024-12-16', asset: 'NQ', direction: 'SHORT', resultR: -0.8, result: -80 },
    { id: '3', date: '2024-12-13', asset: 'ES', direction: 'LONG', resultR: 2.1, result: 210 },
    { id: '4', date: '2024-12-11', asset: 'CL', direction: 'LONG', resultR: 1.2, result: 120 },
    { id: '5', date: '2024-12-09', asset: 'ES', direction: 'SHORT', resultR: 0.9, result: 90 },
  ];

  const stats = {
    totalTrades: 28,
    winRate: 72,
    avgRR: 2.1,
    profitFactor: 2.4,
    avgWin: 185,
    avgLoss: -95,
    maxWin: 420,
    maxLoss: -180,
    streak: 5,
  };

  const totalProfit = 1250;
  const isProfit = totalProfit >= 0;

  const statusColors = {
    active: "bg-profit/10 text-profit border-profit/30",
    review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    avoid: "bg-loss/10 text-loss border-loss/30",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/strategies')}
              className="rounded-xl bg-secondary/50 p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{strategy.name}</h1>
                <span className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  statusColors[strategy.status]
                )}>
                  {strategy.status}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">{strategy.description || 'No description'}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-bold",
            isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
          )}>
            {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {isProfit ? '+' : ''}${totalProfit}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
              </div>
            </div>
          </motion.div>

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
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.winRate}%</p>
              </div>
            </div>
          </motion.div>

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
                <p className="text-sm text-muted-foreground">Avg R:R</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgRR}R</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Factor</p>
                <p className="text-2xl font-bold text-foreground">{stats.profitFactor}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-profit/10 p-3 text-profit">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Streak</p>
                <p className="text-2xl font-bold text-profit">{stats.streak}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Equity Curve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">Equity Curve</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}`, "P&L"]}
                  />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#equityGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Monthly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}`, "P&L"]}
                  />
                  <Bar 
                    dataKey="pnl" 
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Win/Loss Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-profit/30 bg-profit/5 p-5"
          >
            <p className="text-sm text-muted-foreground">Avg Win</p>
            <p className="mt-1 text-2xl font-bold text-profit">+${stats.avgWin}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-loss/30 bg-loss/5 p-5"
          >
            <p className="text-sm text-muted-foreground">Avg Loss</p>
            <p className="mt-1 text-2xl font-bold text-loss">${stats.avgLoss}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-profit/30 bg-profit/5 p-5"
          >
            <p className="text-sm text-muted-foreground">Max Win</p>
            <p className="mt-1 text-2xl font-bold text-profit">+${stats.maxWin}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-loss/30 bg-loss/5 p-5"
          >
            <p className="text-sm text-muted-foreground">Max Loss</p>
            <p className="mt-1 text-2xl font-bold text-loss">${stats.maxLoss}</p>
          </motion.div>
        </div>

        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Trades</h3>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div 
                key={trade.id}
                className="flex items-center justify-between rounded-xl bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "rounded-lg px-2 py-1 text-xs font-medium",
                    trade.direction === 'LONG' ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                  )}>
                    {trade.direction}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{trade.asset}</p>
                    <p className="text-sm text-muted-foreground">{trade.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-mono font-bold",
                    trade.resultR >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {trade.resultR >= 0 ? '+' : ''}{trade.resultR.toFixed(1)}R
                  </p>
                  <p className={cn(
                    "text-sm font-mono",
                    trade.result >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {trade.result >= 0 ? '+' : ''}${trade.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StrategyDetail;
