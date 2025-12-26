import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar, BarChart3, ChevronDown } from "lucide-react";

// Mock data for yearly dashboard
const capitalCurve = [
  { month: "Jan", equity: 10000, pnl: 0 },
  { month: "Feb", equity: 10850, pnl: 850 },
  { month: "Mar", equity: 11200, pnl: 350 },
  { month: "Apr", equity: 10950, pnl: -250 },
  { month: "May", equity: 12100, pnl: 1150 },
  { month: "Jun", equity: 12800, pnl: 700 },
  { month: "Jul", equity: 13450, pnl: 650 },
  { month: "Aug", equity: 14200, pnl: 750 },
  { month: "Sep", equity: 13900, pnl: -300 },
  { month: "Oct", equity: 15100, pnl: 1200 },
  { month: "Nov", equity: 16200, pnl: 1100 },
  { month: "Dec", equity: 17500, pnl: 1300 },
];

const pnlByAsset = [
  { asset: "EURUSD", pnl: 3250, color: "hsl(var(--primary))" },
  { asset: "GBPUSD", pnl: 1820, color: "hsl(var(--primary))" },
  { asset: "BTCUSD", pnl: 1450, color: "hsl(var(--primary))" },
  { asset: "XAUUSD", pnl: 980, color: "hsl(var(--primary))" },
  { asset: "USDJPY", pnl: -320, color: "hsl(var(--loss))" },
];

const pnlByWeekday = [
  { day: "Mon", pnl: 1850, trades: 86 },
  { day: "Tue", pnl: 2420, trades: 102 },
  { day: "Wed", pnl: 1280, trades: 78 },
  { day: "Thu", pnl: 1950, trades: 94 },
  { day: "Fri", pnl: 1680, trades: 88 },
];

const monthlyBreakdown = [
  { month: "Jan", winRate: 65, consistency: 78 },
  { month: "Feb", winRate: 72, consistency: 85 },
  { month: "Mar", winRate: 58, consistency: 70 },
  { month: "Apr", winRate: 52, consistency: 65 },
  { month: "May", winRate: 78, consistency: 92 },
  { month: "Jun", winRate: 70, consistency: 88 },
  { month: "Jul", winRate: 68, consistency: 82 },
  { month: "Aug", winRate: 74, consistency: 90 },
  { month: "Sep", winRate: 55, consistency: 72 },
  { month: "Oct", winRate: 80, consistency: 94 },
  { month: "Nov", winRate: 76, consistency: 91 },
  { month: "Dec", winRate: 82, consistency: 96 },
];

// Assertiveness data (wins/losses/breakeven)
const assertivenessData = [
  { name: "Wins", value: 312, color: "hsl(var(--profit))" },
  { name: "Losses", value: 120, color: "hsl(var(--loss))" },
  { name: "Breakeven", value: 20, color: "hsl(45 93% 47%)" },
];

// Profit by direction
const profitByDirection = {
  long: { pnl: 4850, trades: 285, winRate: 72 },
  short: { pnl: 2650, trades: 167, winRate: 65 },
};

const YearlyMetric = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  delay = 0,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
  >
    <div className="flex items-center justify-between">
      <div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div>
      {trend && (
        <span className={`text-xs font-medium ${trend === "up" ? "text-profit" : "text-loss"}`}>
          {trend === "up" ? "↑" : "↓"} YoY
        </span>
      )}
    </div>
    <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
  </motion.div>
);

const Annual = () => {
  const { t } = useApp();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const totalPnl = capitalCurve[capitalCurve.length - 1].equity - capitalCurve[0].equity;
  const returnPct = ((totalPnl / capitalCurve[0].equity) * 100).toFixed(1);
  
  const years = [currentYear, currentYear - 1, currentYear - 2];
  
  // Calculate overall consistency
  const overallConsistency = Math.round(
    monthlyBreakdown.reduce((acc, m) => acc + m.consistency, 0) / monthlyBreakdown.length
  );
  
  // Calculate total trades
  const totalTrades = assertivenessData.reduce((acc, d) => acc + d.value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.annual.title}</h1>
            <p className="mt-1 text-muted-foreground">{selectedYear} Performance</p>
          </div>
          
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none rounded-xl border border-border bg-card px-4 py-2 pr-10 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Year Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <YearlyMetric
            title="Total P&L"
            value={`$${totalPnl.toLocaleString()}`}
            subtitle={`+${returnPct}% return`}
            icon={<DollarSign className="h-5 w-5" />}
            trend="up"
            delay={0}
          />
          <YearlyMetric
            title="Win Rate (Year)"
            value="69%"
            subtitle="312 wins / 452 trades"
            icon={<Target className="h-5 w-5" />}
            trend="up"
            delay={0.1}
          />
          <YearlyMetric
            title="Profit Factor"
            value="2.18"
            subtitle="Year average"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            delay={0.2}
          />
          <YearlyMetric
            title="Total Trades"
            value="452"
            subtitle="~38/month avg"
            icon={<BarChart3 className="h-5 w-5" />}
            delay={0.3}
          />
          <YearlyMetric
            title={t.annual.overallConsistency}
            value={`${overallConsistency}%`}
            subtitle="Year average"
            icon={<Calendar className="h-5 w-5" />}
            trend="up"
            delay={0.4}
          />
        </div>

        {/* Capital Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t.annual.capitalCurve}</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                ${capitalCurve[capitalCurve.length - 1].equity.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-profit/10 px-3 py-1">
              <TrendingUp className="h-4 w-4 text-profit" />
              <span className="text-sm font-semibold text-profit">+{returnPct}%</span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={capitalCurve}>
                <defs>
                  <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={["dataMin - 500", "dataMax + 500"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Equity"]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#capitalGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Profit by Direction Cards - Moved below Capital Curve */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-profit/30 bg-profit/5 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-profit/20 p-2">
                <TrendingUp className="h-5 w-5 text-profit" />
              </div>
              <div>
                <h3 className="font-semibold text-profit">{t.annual.long}</h3>
                <p className="text-sm text-muted-foreground">{profitByDirection.long.trades} trades</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className="text-2xl font-bold text-profit">+${profitByDirection.long.pnl.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{profitByDirection.long.winRate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border border-loss/30 bg-loss/5 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-loss/20 p-2">
                <TrendingDown className="h-5 w-5 text-loss" />
              </div>
              <div>
                <h3 className="font-semibold text-loss">{t.annual.short}</h3>
                <p className="text-sm text-muted-foreground">{profitByDirection.short.trades} trades</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className="text-2xl font-bold text-profit">+${profitByDirection.short.pnl.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{profitByDirection.short.winRate}%</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PnL by Asset */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">{t.annual.pnlByAsset}</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">Year Distribution</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByAsset} layout="vertical">
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {pnlByAsset.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* PnL by Weekday */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">{t.annual.pnlByWeekday}</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">Year Totals</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByWeekday}>
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Yearly Assertiveness Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
          >
            <h3 className="text-sm font-medium text-muted-foreground">{t.annual.yearlyAssertiveness}</h3>
            <p className="mt-1 text-xl font-semibold text-foreground">{totalTrades} Trades</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assertivenessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {assertivenessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6">
              {assertivenessData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{t.annual[item.name.toLowerCase() as keyof typeof t.annual] || item.name}</span>
                  <span className="text-xs font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Monthly Win Rate + Consistency Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Long-term Consistency</h3>
          <p className="mt-1 text-xl font-semibold text-foreground">Win Rate & Consistency by Month</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyBreakdown}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[40, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name === "winRate" ? "Win Rate" : "Consistency"]}
                />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="consistency"
                  stroke="hsl(var(--primary) / 0.6)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--primary) / 0.6)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary/60" />
              <span className="text-sm text-muted-foreground">Consistency</span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Annual;
