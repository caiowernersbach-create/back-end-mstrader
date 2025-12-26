import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Award } from "lucide-react";

interface StreakCardProps {
  streak: number;
  bestStreak: number;
  winRate: number;
  avgR: number;
  delay?: number;
}

export function StreakCard({ streak, bestStreak, winRate, avgR, delay = 0 }: StreakCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card"
    >
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">Performance Stats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral/10">
            <Flame className="h-5 w-5 text-neutral" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{bestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profit/10">
            <Target className="h-5 w-5 text-profit" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profit/10">
            <TrendingUp className="h-5 w-5 text-profit" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{avgR}R</p>
            <p className="text-xs text-muted-foreground">Avg Win</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
