import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
  variant?: "default" | "profit" | "loss";
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = "default",
  delay = 0,
}: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "mt-2 kpi-value",
            variant === "profit" && "text-profit",
            variant === "loss" && "text-loss",
            variant === "default" && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-glow">
            {icon}
          </div>
        )}
      </div>

      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            trend === "up" && "bg-profit/10 text-profit",
            trend === "down" && "bg-loss/10 text-loss",
            trend === "neutral" && "bg-neutral/10 text-neutral"
          )}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </div>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
