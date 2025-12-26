import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Target, 
  TrendingUp,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon
} from "lucide-react";

// Monthly evolution data
const monthlyEvolution = [
  { day: "1", pnl: 0, cumulative: 0 },
  { day: "3", pnl: 180, cumulative: 180 },
  { day: "5", pnl: 250, cumulative: 430 },
  { day: "8", pnl: -120, cumulative: 310 },
  { day: "10", pnl: -70, cumulative: 240 },
  { day: "12", pnl: 320, cumulative: 560 },
  { day: "15", pnl: 420, cumulative: 980 },
  { day: "17", pnl: -90, cumulative: 890 },
  { day: "19", pnl: 210, cumulative: 1100 },
  { day: "20", pnl: 180, cumulative: 1280 },
  { day: "22", pnl: -60, cumulative: 1220 },
  { day: "25", pnl: 350, cumulative: 1570 },
  { day: "27", pnl: 150, cumulative: 1720 },
  { day: "30", pnl: 215, cumulative: 1935 },
];

// Gains by asset
const assetGains = [
  { asset: "EURUSD", pnl: 580, trades: 12 },
  { asset: "GBPUSD", pnl: 320, trades: 8 },
  { asset: "USDJPY", pnl: -120, trades: 6 },
  { asset: "BTCUSD", pnl: 450, trades: 9 },
  { asset: "XAUUSD", pnl: 115, trades: 7 },
];

// Result per day of week
const weekdayPerformance = [
  { day: "Mon", pnl: 280, trades: 8 },
  { day: "Tue", pnl: 420, trades: 10 },
  { day: "Wed", pnl: -85, trades: 7 },
  { day: "Thu", pnl: 350, trades: 9 },
  { day: "Fri", pnl: 380, trades: 8 },
];

// Consistency per pillar
const consistencyData = [
  { name: "Risk", value: 92 },
  { name: "Strategy", value: 85 },
  { name: "Feeling", value: 78 },
];

// Weekly data
const weeklyData = [
  { week: "Week 1", resultR: 3.2, gainPct: 2.8, assertiveness: 75 },
  { week: "Week 2", resultR: 4.5, gainPct: 3.5, assertiveness: 82 },
  { week: "Week 3", resultR: -1.2, gainPct: -0.9, assertiveness: 45 },
  { week: "Week 4", resultR: 5.8, gainPct: 4.2, assertiveness: 88 },
];

const MetricCard = ({ 
  title, 
  value, 
  subtitle,
  icon,
  trend,
  variant,
  delay = 0 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  variant?: "profit" | "loss";
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
  >
    <div className="flex items-center justify-between">
      <div className={cn(
        "rounded-xl p-3",
        variant === "profit" ? "bg-profit/10 text-profit" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-medium",
          trend === "up" ? "text-profit" : "text-loss"
        )}>
          {trend === "up" ? "↑" : "↓"}
        </span>
      )}
    </div>
    <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
    <p className={cn(
      "mt-1 text-2xl font-bold",
      variant === "profit" ? "text-profit" : "text-foreground"
    )}>
      {value}
    </p>
    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
  </motion.div>
);

const Overview = () => {
  const { t } = useApp();
  const [selectedMonth, setSelectedMonth] = useState("December 2024");
  const [chartType, setChartType] = useState<"cumulative" | "daily">("cumulative");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.dashboard.monthlyOverview}</h1>
            <p className="mt-1 text-muted-foreground">{t.dashboard.subtitle}</p>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{selectedMonth}</span>
            </div>
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={t.dashboard.winRate}
            value="68%"
            subtitle="28 wins / 42 trades"
            icon={<Target className="h-5 w-5" />}
            trend="up"
            delay={0}
          />
          <MetricCard
            title={t.dashboard.profitFactor}
            value="2.34"
            subtitle="Gain/Loss ratio"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            delay={0.1}
          />
          <MetricCard
            title={t.dashboard.totalR}
            value="+12.5R"
            subtitle="Avg 1.8R per trade"
            icon={<BarChart3 className="h-5 w-5" />}
            delay={0.2}
          />
          <MetricCard
            title={t.dashboard.netPnL}
            value="$1,935"
            subtitle="+13.45% return"
            icon={<DollarSign className="h-5 w-5" />}
            trend="up"
            variant="profit"
            delay={0.3}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Monthly Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-2 rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monthly Evolution</h3>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {chartType === "cumulative" ? "Cumulative P&L" : "Daily P&L"}
                </p>
              </div>
              
              {/* Chart Toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
                <button
                  onClick={() => setChartType("cumulative")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    chartType === "cumulative"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LineChartIcon className="h-4 w-4" />
                  Cumulative
                </button>
                <button
                  onClick={() => setChartType("daily")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    chartType === "daily"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  Daily
                </button>
              </div>
            </div>
            
            <div className="mt-4 h-64">
              <AnimatePresence mode="wait">
                {chartType === "cumulative" ? (
                  <motion.div
                    key="cumulative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyEvolution}>
                        <defs>
                          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [`$${value}`, "Cumulative P&L"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulative"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#pnlGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="daily"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyEvolution}>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [`$${value}`, "Daily P&L"]}
                        />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                          {monthlyEvolution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Consistency Per Pillar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">{t.dashboard.consistency}</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">3 Pillars</p>
            <div className="mt-6 space-y-4">
              {consistencyData.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground">{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                      className="h-full rounded-full bg-primary"
                      style={{ opacity: 1 - index * 0.15 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-primary/10 p-4 text-center">
              <p className="text-2xl font-bold text-primary">85%</p>
              <p className="text-xs text-muted-foreground">Average Consistency</p>
            </div>
          </motion.div>
        </div>

        {/* Weekly Summary - Below Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <h3 className="mb-6 text-sm font-medium text-muted-foreground">{t.dashboard.weeklySummary}</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {weeklyData.map((week, index) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="rounded-xl border border-border bg-secondary/30 p-4"
              >
                <p className="text-sm font-medium text-muted-foreground">{week.week}</p>
                <p className={cn(
                  "mt-2 font-mono text-2xl font-bold",
                  week.resultR >= 0 ? "text-profit" : "text-loss"
                )}>
                  {week.resultR >= 0 ? "+" : ""}{week.resultR}R
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Gain</span>
                    <p className={cn(
                      "font-semibold",
                      week.gainPct >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {week.gainPct >= 0 ? "+" : ""}{week.gainPct}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accuracy</span>
                    <p className="font-semibold text-primary">{week.assertiveness}%</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gains by Asset */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Gains by Asset</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">P&L Distribution</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetGains} layout="vertical">
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="asset"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {assetGains.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Result per Day of Week */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Result per Day of Week</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">Weekday Performance</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayPerformance}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {weekdayPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Overview;
