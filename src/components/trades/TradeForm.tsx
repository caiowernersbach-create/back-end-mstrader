import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Save, X, Upload, Image, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";

const assets = ["NQ", "ES", "CL", "GC", "RTY", "YM", "ZB", "6E"];
const strategies = ["Momentum Breakout", "Mean Reversion", "Range Fade", "Trend Continuation", "Gap Fill", "VWAP Bounce"];

export function TradeForm() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [asset, setAsset] = useState("NQ");
  const [strategy, setStrategy] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [riskPct, setRiskPct] = useState(100);
  const [strategyPct, setStrategyPct] = useState(100);
  const [entryPct, setEntryPct] = useState(100);
  
  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const calculateR = () => {
    if (!entryPrice || !stopLoss || !exitPrice) return null;
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const exit = parseFloat(exitPrice);
    const qty = parseFloat(quantity) || 1;
    
    const rInitial = Math.abs(entry - stop) * qty;
    const pnl = direction === "long" 
      ? (exit - entry) * qty 
      : (entry - exit) * qty;
    
    return rInitial > 0 ? pnl / rInitial : 0;
  };

  const calculatePnL = () => {
    if (!entryPrice || !exitPrice) return null;
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseFloat(quantity) || 1;
    
    const tickValue = asset === "NQ" ? 5 : asset === "ES" ? 12.5 : 10;
    return direction === "long" 
      ? (exit - entry) * qty * tickValue
      : (entry - exit) * qty * tickValue;
  };

  const rMultiple = calculateR();
  const pnl = calculatePnL();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Trade saved",
      description: `${asset} ${direction} trade recorded successfully.`,
    });
    navigate("/");
  };

  const handleImageUpload = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG or JPG)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const removeImage = useCallback(() => {
    setImagePreview(null);
  }, []);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-8"
    >
      {/* Direction Toggle */}
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => setDirection("long")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200",
            direction === "long"
              ? "bg-profit text-profit-foreground shadow-lg shadow-profit/25"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          )}
        >
          <ArrowUpRight className="h-5 w-5" />
          {t.trade.long}
        </button>
        <button
          type="button"
          onClick={() => setDirection("short")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200",
            direction === "short"
              ? "bg-loss text-loss-foreground shadow-lg shadow-loss/25"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          )}
        >
          <ArrowDownRight className="h-5 w-5" />
          {t.trade.short}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Asset Selection */}
          <div className="stat-card">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">{t.trade.asset}</label>
            <div className="grid grid-cols-4 gap-2">
              {assets.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAsset(a)}
                  className={cn(
                    "rounded-lg py-3 text-sm font-semibold transition-all",
                    asset === a
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div className="stat-card">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">{t.trade.strategy}</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="input-trading w-full"
            >
              <option value="">Select strategy...</option>
              {strategies.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Price Inputs */}
          <div className="stat-card">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">Trade Details</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.trade.entry}</label>
                <input
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="input-trading w-full font-mono"
                  placeholder="21250.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.trade.stopLoss}</label>
                <input
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="input-trading w-full font-mono"
                  placeholder="21240.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.trade.exit}</label>
                <input
                  type="number"
                  step="0.01"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="input-trading w-full font-mono"
                  placeholder="21275.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.trade.quantity}</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-trading w-full font-mono"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="stat-card">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">{t.trade.uploadImage}</label>
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
                  isDragOver
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Upload className={cn(
                  "h-10 w-10 transition-colors",
                  isDragOver ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="mt-3 text-sm font-medium text-foreground">{t.trade.dragDrop}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.trade.imageLimit}</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={imagePreview}
                  alt="Trade screenshot"
                  className="h-auto max-h-[200px] w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-lg bg-loss/90 p-2 text-loss-foreground transition-colors hover:bg-loss"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Compliance Sliders */}
          <div className="stat-card">
            <label className="mb-4 block text-sm font-medium text-muted-foreground">Compliance Score</label>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.trade.riskManagement}</span>
                  <span className="font-mono text-sm text-primary">{riskPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskPct}
                  onChange={(e) => setRiskPct(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.trade.strategyAdherence}</span>
                  <span className="font-mono text-sm text-primary">{strategyPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={strategyPct}
                  onChange={(e) => setStrategyPct(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.trade.entryQuality}</span>
                  <span className="font-mono text-sm text-primary">{entryPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={entryPct}
                  onChange={(e) => setEntryPct(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Result Preview */}
          {(rMultiple !== null || pnl !== null) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="stat-card"
            >
              <label className="mb-4 block text-sm font-medium text-muted-foreground">{t.trade.result}</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t.trade.rMultiple}</p>
                  <p className={cn(
                    "mt-1 font-mono text-3xl font-bold",
                    (rMultiple ?? 0) >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {rMultiple !== null ? `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">P&L</p>
                  <p className={cn(
                    "mt-1 font-mono text-3xl font-bold",
                    (pnl ?? 0) >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {pnl !== null ? `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(0)}` : "—"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <div className="stat-card">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">{t.trade.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-trading min-h-[100px] w-full resize-none"
              placeholder={t.trade.notesPlaceholder}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          <X className="h-4 w-4" />
          {t.common.cancel}
        </button>
        <button type="submit" className="btn-primary">
          <Save className="h-4 w-4" />
          {t.trade.saveTrade}
        </button>
      </div>
    </motion.form>
  );
}
