import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  UserPlus, 
  Clock,
  Check,
  ArrowRight,
  Target,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import { getStudentDashboardData } from "@/services/mockData.service";

// Connection states
type ConnectionState = 'not_connected' | 'pending' | 'connected';

const EducationalRoom = () => {
  const { t } = useApp();
  const [state, setState] = useState<ConnectionState>('connected'); // Default to connected for demo
  const [mentorId, setMentorId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(11); // December
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0);

  // Get student data from mock service
  const studentData = getStudentDashboardData();

  const handleConnect = () => {
    if (mentorId.trim()) {
      setState('pending');
    }
  };

  // Mock mentor trades with images for educational slider
  const mentorTradesWithImages = [
    { id: '1', date: '2024-12-02', asset: 'ES', direction: 'LONG', resultR: 1.5, result: 305, strategy: 'Breakout', notes: 'Strong momentum entry after consolidation breakout', riskReward: '1:2.5', imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop' },
    { id: '2', date: '2024-12-03', asset: 'NQ', direction: 'SHORT', resultR: 2.1, result: 350, strategy: 'Pullback', notes: 'Bearish divergence on RSI, perfect entry at resistance', riskReward: '1:3', imageUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop' },
    { id: '3', date: '2024-12-04', asset: 'CL', direction: 'LONG', resultR: -0.8, result: -195, strategy: 'Momentum', notes: 'Market reversed quickly, stopped out early', riskReward: '1:2', imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop' },
    { id: '4', date: '2024-12-05', asset: 'ES', direction: 'LONG', resultR: 1.9, result: 390, strategy: 'Breakout', notes: 'Followed the trend with tight stop', riskReward: '1:2.5', imageUrl: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=400&h=300&fit=crop' },
    { id: '5', date: '2024-12-09', asset: 'GC', direction: 'SHORT', resultR: 2.0, result: 405, strategy: 'Reversal', notes: 'Key level rejection with volume confirmation', riskReward: '1:2', imageUrl: 'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=400&h=300&fit=crop' },
    { id: '6', date: '2024-12-10', asset: 'NQ', direction: 'LONG', resultR: 1.0, result: 150, strategy: 'Pullback', notes: 'Scaled out early for reduced profit', riskReward: '1:1.5', imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop' },
    { id: '7', date: '2024-12-11', asset: 'ES', direction: 'LONG', resultR: 2.0, result: 400, strategy: 'Breakout', notes: 'Perfect execution on opening range breakout', riskReward: '1:2.5', imageUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop' },
    { id: '8', date: '2024-12-12', asset: 'CL', direction: 'SHORT', resultR: -1.2, result: -120, strategy: 'Momentum', notes: 'False breakdown, market went opposite', riskReward: '1:2', imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop' },
  ];

  // Calculate cumulative equity based on current index
  const equityEvolution = useMemo(() => {
    let cumulative = 0;
    return mentorTradesWithImages.slice(0, currentTradeIndex + 1).map((trade, idx) => {
      cumulative += trade.result;
      return {
        date: trade.date.substring(5), // MM-DD format
        day: idx + 1,
        pnl: cumulative,
        dailyPnl: trade.result
      };
    });
  }, [currentTradeIndex]);

  // Daily PnL data for bar chart
  const dailyPnlData = mentorTradesWithImages.slice(0, currentTradeIndex + 1).map(trade => ({
    date: trade.date.substring(8), // DD only
    pnl: trade.result
  }));

  // Accuracy donut data
  const totalTrades = mentorTradesWithImages.length;
  const wins = mentorTradesWithImages.filter(t => t.resultR > 0).length;
  const losses = mentorTradesWithImages.filter(t => t.resultR < 0).length;
  const winRate = Math.round((wins / totalTrades) * 100);

  const accuracyData = [
    { name: 'Gains', value: wins, color: 'hsl(var(--profit))' },
    { name: 'Stops', value: losses, color: 'hsl(var(--loss))' }
  ];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const mentorStats = {
    totalR: studentData.mentorData?.totalR || 18.5,
    winRate: studentData.mentorData?.winRate || 68,
    avgR: studentData.mentorData?.avgR || 1.42,
    totalTrades: mentorTradesWithImages.length,
    monthResult: equityEvolution.length > 0 ? equityEvolution[equityEvolution.length - 1].pnl : 0,
    monthRR: '20/1',
  };

  const handlePrevTrade = () => {
    if (currentTradeIndex > 0) {
      setCurrentTradeIndex(currentTradeIndex - 1);
    }
  };

  const handleNextTrade = () => {
    if (currentTradeIndex < mentorTradesWithImages.length - 1) {
      setCurrentTradeIndex(currentTradeIndex + 1);
    }
  };

  // Not Connected State
  const NotConnectedView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/50 py-16"
    >
      <div className="rounded-full bg-primary/10 p-4">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{t.educational.noMentor}</h3>
      <p className="mt-2 text-sm text-muted-foreground mb-6">
        Connect with a mentor to access their educational room
      </p>
      
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            placeholder={t.educational.enterMentorId}
            className="input-trading w-full pr-12"
          />
          <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <button 
          onClick={handleConnect}
          disabled={!mentorId.trim()}
          className={cn(
            "btn-primary w-full",
            !mentorId.trim() && "opacity-50 cursor-not-allowed"
          )}
        >
          {t.educational.connectCta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );

  // Pending State
  const PendingView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-16"
    >
      <div className="rounded-full bg-neutral/10 p-4">
        <Clock className="h-8 w-8 text-neutral animate-pulse" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{t.educational.pendingApproval}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Waiting for mentor to accept your request
      </p>
      <div className="mt-6 rounded-lg bg-secondary/50 px-4 py-2 font-mono text-muted-foreground">
        {mentorId}
      </div>
    </motion.div>
  );

  // Connected State - Mentor Room Dashboard
  const ConnectedView = () => {
    const currentTrade = mentorTradesWithImages[currentTradeIndex];
    
    return (
    <div className="space-y-8">
      {/* Header with Month Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.educational.connected}</p>
            <h2 className="text-xl font-semibold text-foreground">Marcus Chen</h2>
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedMonth(m => Math.max(0, m - 1))}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 rounded-lg bg-secondary text-foreground font-medium min-w-[100px] text-center">
            {monthNames[selectedMonth]} 2024
          </span>
          <button 
            onClick={() => setSelectedMonth(m => Math.min(11, m + 1))}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Summary Bar - Like Image 2 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-8 rounded-xl border border-border/50 bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">RES. MÊS:</span>
          <span className={cn(
            "font-mono font-bold text-lg",
            mentorStats.monthResult >= 0 ? "text-profit" : "text-loss"
          )}>
            $ {mentorStats.monthResult.toLocaleString()},00
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">RR MÊS:</span>
          <span className="font-mono font-bold text-lg text-primary">
            {mentorStats.monthRR}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">TOTAL DE TRADES:</span>
          <span className="font-mono font-bold text-lg text-foreground">
            {mentorStats.totalTrades}
          </span>
        </div>
      </motion.div>

      {/* Monthly Equity Evolution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly P&L Evolution</h3>
          <span className="text-xs text-muted-foreground">Trade {currentTradeIndex + 1} of {mentorTradesWithImages.length}</span>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityEvolution}>
              <defs>
                <linearGradient id="eduGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Cumulative P&L"]}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#eduGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Charts Row - Like Image 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accuracy Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-profit">{wins}</span>
                  <span className="text-sm text-muted-foreground">GAINS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-loss">{losses}</span>
                  <span className="text-sm text-muted-foreground">STOPS</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accuracyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {accuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">{winRate}%</span>
            </div>
          </div>
        </motion.div>

        {/* Daily PnL Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily P&L</h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnlData}>
                <XAxis
                  dataKey="date"
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--profit))"
                >
                  {dailyPnlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Trade Slider Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Mentor's Recent Trades</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevTrade}
              disabled={currentTradeIndex === 0}
              className={cn(
                "rounded-lg p-2 transition-colors",
                currentTradeIndex === 0 
                  ? "text-muted-foreground/30 cursor-not-allowed" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-muted-foreground">
              {currentTradeIndex + 1} / {mentorTradesWithImages.length}
            </span>
            <button 
              onClick={handleNextTrade}
              disabled={currentTradeIndex === mentorTradesWithImages.length - 1}
              className={cn(
                "rounded-lg p-2 transition-colors",
                currentTradeIndex === mentorTradesWithImages.length - 1
                  ? "text-muted-foreground/30 cursor-not-allowed" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Current Trade Card */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trade Image */}
          <div className="rounded-xl overflow-hidden bg-secondary/30 aspect-video">
            <img 
              src={currentTrade.imageUrl} 
              alt={`Trade ${currentTrade.id}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Trade Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  currentTrade.direction === 'LONG' ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                )}>
                  {currentTrade.direction === 'LONG' 
                    ? <ArrowUpRight className="h-5 w-5" />
                    : <ArrowDownRight className="h-5 w-5" />
                  }
                </div>
                <div>
                  <span className="font-semibold text-foreground text-lg">{currentTrade.asset}</span>
                  <p className="text-sm text-muted-foreground">{currentTrade.date}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">#{currentTrade.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Result (R)</p>
                <p className={cn(
                  "font-mono text-xl font-bold",
                  currentTrade.resultR >= 0 ? "text-profit" : "text-loss"
                )}>
                  {currentTrade.resultR >= 0 ? '+' : ''}{currentTrade.resultR.toFixed(1)}R
                </p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Risk-Reward</p>
                <p className="font-mono text-xl font-bold text-foreground">
                  {currentTrade.riskReward}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">Strategy</p>
              <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {currentTrade.strategy}
              </span>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-foreground">{currentTrade.notes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Progress Indicators */}
        <div className="flex items-center justify-center gap-1 mt-6">
          {mentorTradesWithImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentTradeIndex(idx)}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === currentTradeIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-secondary hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )};

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.educational.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.educational.subtitle}</p>
        </div>

        {/* Content based on state */}
        {state === 'not_connected' && <NotConnectedView />}
        {state === 'pending' && <PendingView />}
        {state === 'connected' && <ConnectedView />}
      </div>
    </DashboardLayout>
  );
};

export default EducationalRoom;