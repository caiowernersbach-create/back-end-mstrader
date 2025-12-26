import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface Trade {
  id: string;
  asset: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  rMultiple: number;
  date: string;
  strategy: string;
}

const recentTrades: Trade[] = [
  {
    id: "1",
    asset: "NQ",
    direction: "long",
    entryPrice: 21250.50,
    exitPrice: 21285.00,
    pnl: 690,
    rMultiple: 2.3,
    date: "Dec 08",
    strategy: "Momentum Breakout",
  },
  {
    id: "2",
    asset: "ES",
    direction: "short",
    entryPrice: 6050.25,
    exitPrice: 6035.00,
    pnl: 305,
    rMultiple: 1.5,
    date: "Dec 08",
    strategy: "Mean Reversion",
  },
  {
    id: "3",
    asset: "NQ",
    direction: "long",
    entryPrice: 21180.00,
    exitPrice: 21165.00,
    pnl: -300,
    rMultiple: -1.0,
    date: "Dec 07",
    strategy: "Momentum Breakout",
  },
  {
    id: "4",
    asset: "CL",
    direction: "short",
    entryPrice: 68.50,
    exitPrice: 68.20,
    pnl: 300,
    rMultiple: 1.2,
    date: "Dec 07",
    strategy: "Range Fade",
  },
  {
    id: "5",
    asset: "GC",
    direction: "long",
    entryPrice: 2045.00,
    exitPrice: 2052.50,
    pnl: 750,
    rMultiple: 2.5,
    date: "Dec 06",
    strategy: "Trend Continuation",
  },
];

interface TradeListProps {
  delay?: number;
}

export function TradeList({ delay = 0 }: TradeListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card col-span-2"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Trades</h3>
        <Link to="/trades" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + index * 0.05 }}
          >
            <Link
              to={`/trade/${trade.id}`}
              className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50"
            >
              {/* Direction & Asset */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  trade.direction === "long" ? "bg-profit/10" : "bg-loss/10"
                )}>
                  {trade.direction === "long" ? (
                    <ArrowUpRight className="h-5 w-5 text-profit" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-loss" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{trade.asset}</p>
                  <p className="text-xs text-muted-foreground capitalize">{trade.direction}</p>
                </div>
              </div>

              {/* Strategy */}
              <div className="hidden flex-1 md:block">
                <p className="text-sm text-muted-foreground">{trade.strategy}</p>
              </div>

              {/* R Multiple */}
              <div className="text-right">
                <p className={cn(
                  "font-mono text-sm font-semibold",
                  trade.rMultiple >= 0 ? "text-profit" : "text-loss"
                )}>
                  {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(1)}R
                </p>
                <p className="text-xs text-muted-foreground">{trade.date}</p>
              </div>

              {/* PnL */}
              <div className="w-24 text-right">
                <p className={cn(
                  "font-mono font-semibold",
                  trade.pnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toLocaleString()}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
