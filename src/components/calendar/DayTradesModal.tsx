import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

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

interface DayTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  totalPnl: number;
}

export function DayTradesModal({ isOpen, onClose, date, trades, totalPnl }: DayTradesModalProps) {
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0);

  if (!isOpen) return null;

  const currentTrade = trades[currentTradeIndex];
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const goToPrevious = () => {
    if (currentTradeIndex > 0) setCurrentTradeIndex(currentTradeIndex - 1);
  };

  const goToNext = () => {
    if (currentTradeIndex < trades.length - 1) setCurrentTradeIndex(currentTradeIndex + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm p-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">{formattedDate}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-muted-foreground">{trades.length} trades</span>
                <span className={cn(
                  "font-mono font-semibold",
                  totalPnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Trade Content */}
          {currentTrade && (
            <div className="p-6 space-y-6">
              {/* Trade Navigation */}
              {trades.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPrevious}
                    disabled={currentTradeIndex === 0}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                      currentTradeIndex === 0
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <div className="flex gap-1.5">
                    {trades.map((_, idx) => (
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
                  <button
                    onClick={goToNext}
                    disabled={currentTradeIndex === trades.length - 1}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                      currentTradeIndex === trades.length - 1
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Trade Image */}
                  <div className="mb-6">
                    {currentTrade.image_url ? (
                      <div className="rounded-xl overflow-hidden border border-border/50">
                        <img
                          src={currentTrade.image_url}
                          alt="Trade screenshot"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border/50 bg-secondary/20">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No trade image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trade Info */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl",
                          currentTrade.direction === 'long'
                            ? "bg-profit/10 text-profit"
                            : "bg-loss/10 text-loss"
                        )}>
                          {currentTrade.direction === 'long'
                            ? <ArrowUpRight className="h-7 w-7" />
                            : <ArrowDownRight className="h-7 w-7" />
                          }
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">{currentTrade.asset}</p>
                          <p className="text-sm text-muted-foreground font-mono">Trade #{currentTrade.id.slice(4, 12)}</p>
                        </div>
                      </div>

                      {/* Result */}
                      <div className="rounded-xl bg-secondary/30 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Result (R)</p>
                            <p className={cn(
                              "font-mono text-2xl font-bold",
                              currentTrade.result_r >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {currentTrade.result_r >= 0 ? '+' : ''}{currentTrade.result_r.toFixed(2)}R
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">P&L</p>
                            <p className={cn(
                              "font-mono text-2xl font-bold",
                              currentTrade.result_value >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {currentTrade.result_value >= 0 ? '+' : ''}${currentTrade.result_value.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Risk-Reward */}
                      <div className="rounded-xl bg-secondary/30 p-4">
                        <p className="text-sm text-muted-foreground">Risk-Reward Ratio</p>
                        <p className="font-mono text-xl font-semibold text-foreground">
                          {currentTrade.riskReward.toFixed(1)}:1
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Compliance Tags */}
                      <div className="space-y-3">
                        <div className={cn(
                          "flex items-center gap-3 rounded-xl p-4",
                          currentTrade.emotion === 'in_control'
                            ? "bg-profit/10 border border-profit/30"
                            : "bg-loss/10 border border-loss/30"
                        )}>
                          {currentTrade.emotion === 'in_control'
                            ? <CheckCircle className="h-5 w-5 text-profit" />
                            : <XCircle className="h-5 w-5 text-loss" />
                          }
                          <div>
                            <p className="text-sm text-muted-foreground">Emotion</p>
                            <p className={cn(
                              "font-medium",
                              currentTrade.emotion === 'in_control' ? "text-profit" : "text-loss"
                            )}>
                              {currentTrade.emotion === 'in_control' ? 'In Control' : 'Out of Control'}
                            </p>
                          </div>
                        </div>

                        <div className={cn(
                          "flex items-center gap-3 rounded-xl p-4",
                          currentTrade.is_out_of_strategy
                            ? "bg-loss/10 border border-loss/30"
                            : "bg-profit/10 border border-profit/30"
                        )}>
                          {currentTrade.is_out_of_strategy
                            ? <XCircle className="h-5 w-5 text-loss" />
                            : <CheckCircle className="h-5 w-5 text-profit" />
                          }
                          <div>
                            <p className="text-sm text-muted-foreground">Strategy</p>
                            <p className={cn(
                              "font-medium",
                              currentTrade.is_out_of_strategy ? "text-loss" : "text-profit"
                            )}>
                              {currentTrade.is_out_of_strategy ? 'Out of Strategy' : currentTrade.strategy_id}
                            </p>
                          </div>
                        </div>

                        <div className={cn(
                          "flex items-center gap-3 rounded-xl p-4",
                          currentTrade.is_out_of_risk
                            ? "bg-loss/10 border border-loss/30"
                            : "bg-profit/10 border border-profit/30"
                        )}>
                          {currentTrade.is_out_of_risk
                            ? <AlertCircle className="h-5 w-5 text-loss" />
                            : <CheckCircle className="h-5 w-5 text-profit" />
                          }
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Management</p>
                            <p className={cn(
                              "font-medium",
                              currentTrade.is_out_of_risk ? "text-loss" : "text-profit"
                            )}>
                              {currentTrade.is_out_of_risk ? 'Out of Risk' : 'Within Risk'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {currentTrade.notes && (
                        <div className="rounded-xl bg-secondary/30 p-4">
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-foreground">{currentTrade.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
