import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CompliancePillars } from "@/components/dashboard/PillarBar";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { TradeList } from "@/components/dashboard/TradeList";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">December 2024 Performance</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-profit" />
            <span className="text-sm font-medium text-primary">Live Session</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total P&L"
            value="$2,845"
            trend="up"
            trendValue="+18.5%"
            icon={<DollarSign className="h-6 w-6" />}
            variant="profit"
            delay={0}
          />
          <KPICard
            title="Win Rate"
            value="68%"
            trend="up"
            trendValue="+5.2%"
            icon={<Target className="h-6 w-6" />}
            delay={0.1}
          />
          <KPICard
            title="Avg R-Multiple"
            value="1.8R"
            trend="up"
            trendValue="+0.3R"
            icon={<TrendingUp className="h-6 w-6" />}
            delay={0.2}
          />
          <KPICard
            title="Trades This Month"
            value="42"
            subtitle="12 today"
            icon={<BarChart3 className="h-6 w-6" />}
            delay={0.3}
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Equity Chart - Spans 2 columns */}
          <EquityChart delay={0.4} />

          {/* Compliance Pillars */}
          <CompliancePillars
            riskPct={92}
            strategyPct={85}
            entryPct={78}
            delay={0.5}
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Trades - Spans 2 columns */}
          <TradeList delay={0.6} />

          {/* Performance Stats */}
          <StreakCard
            streak={12}
            bestStreak={18}
            winRate={68}
            avgR={1.8}
            delay={0.7}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
