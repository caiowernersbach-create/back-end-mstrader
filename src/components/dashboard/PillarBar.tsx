import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PillarBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: "primary" | "profit" | "loss" | "neutral";
  delay?: number;
}

export function PillarBar({
  label,
  value,
  maxValue = 100,
  color = "primary",
  delay = 0,
}: PillarBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorClasses = {
    primary: "from-primary to-primary/70",
    profit: "from-profit to-profit/70",
    loss: "from-loss to-loss/70",
    neutral: "from-neutral to-neutral/70",
  };

  const glowClasses = {
    primary: "shadow-[0_0_15px_hsl(var(--primary)/0.4)]",
    profit: "shadow-[0_0_15px_hsl(var(--profit)/0.4)]",
    loss: "shadow-[0_0_15px_hsl(var(--loss)/0.4)]",
    neutral: "shadow-[0_0_15px_hsl(var(--neutral)/0.4)]",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-32 w-8 items-end overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          className={cn(
            "w-full rounded-full bg-gradient-to-t",
            colorClasses[color],
            glowClasses[color]
          )}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{value}%</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface CompliancePillarsProps {
  riskPct: number;
  strategyPct: number;
  entryPct: number;
  delay?: number;
}

export function CompliancePillars({ riskPct, strategyPct, entryPct, delay = 0 }: CompliancePillarsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card"
    >
      <h3 className="mb-6 text-sm font-medium text-muted-foreground">Daily Compliance</h3>
      <div className="flex items-end justify-center gap-8">
        <PillarBar label="Risk" value={riskPct} delay={delay + 0.1} color={riskPct >= 80 ? "profit" : riskPct >= 60 ? "neutral" : "loss"} />
        <PillarBar label="Strategy" value={strategyPct} delay={delay + 0.2} color={strategyPct >= 80 ? "profit" : strategyPct >= 60 ? "neutral" : "loss"} />
        <PillarBar label="Entry" value={entryPct} delay={delay + 0.3} color={entryPct >= 80 ? "profit" : entryPct >= 60 ? "neutral" : "loss"} />
      </div>
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-profit animate-pulse-glow" />
        <span className="text-sm font-medium text-profit">12 Day Streak</span>
      </div>
    </motion.div>
  );
}
