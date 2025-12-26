import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const trades = [
  { id: "1", date: "2024-12-08", asset: "NQ", direction: "long", strategy: "Momentum Breakout", entry: 21250.50, stop: 21240.00, exit: 21285.00, qty: 2, pnl: 690, rMultiple: 2.3, riskPct: 95, strategyPct: 90, entryPct: 85 },
  { id: "2", date: "2024-12-08", asset: "ES", direction: "short", strategy: "Mean Reversion", entry: 6050.25, stop: 6058.00, exit: 6035.00, qty: 1, pnl: 305, rMultiple: 1.5, riskPct: 88, strategyPct: 92, entryPct: 80 },
  { id: "3", date: "2024-12-07", asset: "NQ", direction: "long", strategy: "Momentum Breakout", entry: 21180.00, stop: 21190.00, exit: 21165.00, qty: 1, pnl: -300, rMultiple: -1.0, riskPct: 70, strategyPct: 75, entryPct: 65 },
  { id: "4", date: "2024-12-07", asset: "CL", direction: "short", strategy: "Range Fade", entry: 68.50, stop: 68.75, exit: 68.20, qty: 2, pnl: 600, rMultiple: 1.2, riskPct: 90, strategyPct: 88, entryPct: 85 },
  { id: "5", date: "2024-12-06", asset: "GC", direction: "long", strategy: "Trend Continuation", entry: 2045.00, stop: 2042.00, exit: 2052.50, qty: 1, pnl: 750, rMultiple: 2.5, riskPct: 100, strategyPct: 95, entryPct: 92 },
  { id: "6", date: "2024-12-06", asset: "NQ", direction: "short", strategy: "Mean Reversion", entry: 21150.00, stop: 21165.00, exit: 21120.00, qty: 1, pnl: 600, rMultiple: 2.0, riskPct: 92, strategyPct: 88, entryPct: 90 },
  { id: "7", date: "2024-12-05", asset: "ES", direction: "long", strategy: "Gap Fill", entry: 6020.00, stop: 6012.00, exit: 6040.00, qty: 2, pnl: 500, rMultiple: 1.25, riskPct: 85, strategyPct: 90, entryPct: 88 },
  { id: "8", date: "2024-12-05", asset: "RTY", direction: "long", strategy: "VWAP Bounce", entry: 2350.00, stop: 2345.00, exit: 2365.00, qty: 1, pnl: 750, rMultiple: 3.0, riskPct: 95, strategyPct: 92, entryPct: 94 },
];

const Trades = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredTrades = trades.filter(trade => 
    trade.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trade History</h1>
            <p className="mt-1 text-muted-foreground">View and manage all your trades</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary">
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link to="/trade/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              New Trade
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by asset or strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-trading w-full pl-11"
            />
          </div>
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Asset</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Direction</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Strategy</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Entry</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Exit</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">R Multiple</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group transition-colors hover:bg-secondary/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link to={`/trade/${trade.id}`} className="text-sm text-foreground hover:text-primary">
                        {trade.date}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-medium text-foreground">{trade.asset}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        trade.direction === "long" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                      )}>
                        {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trade.direction}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {trade.strategy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm text-foreground">
                      {trade.entry.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm text-foreground">
                      {trade.exit.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className={cn(
                        "font-mono text-sm font-semibold",
                        trade.rMultiple >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(1)}R
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className={cn(
                        "font-mono font-semibold",
                        trade.pnl >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toLocaleString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">1-{filteredTrades.length}</span> of <span className="font-medium text-foreground">{filteredTrades.length}</span> trades
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-2" disabled>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="btn-secondary px-3 py-2" disabled>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Trades;
