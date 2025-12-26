import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { date: "Dec 01", equity: 10000, pnl: 0 },
  { date: "Dec 02", equity: 10250, pnl: 250 },
  { date: "Dec 03", equity: 10180, pnl: -70 },
  { date: "Dec 04", equity: 10450, pnl: 270 },
  { date: "Dec 05", equity: 10520, pnl: 70 },
  { date: "Dec 06", equity: 10890, pnl: 370 },
  { date: "Dec 07", equity: 10750, pnl: -140 },
  { date: "Dec 08", equity: 11200, pnl: 450 },
];

interface EquityChartProps {
  delay?: number;
}

export function EquityChart({ delay = 0 }: EquityChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card col-span-2"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Equity Curve</h3>
          <p className="mt-1 text-2xl font-semibold text-foreground">$11,200.00</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Equity</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(156 98% 34%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(156 98% 34%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke="hsl(0 3% 18%)" 
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
              dx={-10}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 3% 10%)",
                border: "1px solid hsl(0 3% 18%)",
                borderRadius: "8px",
                boxShadow: "0 4px 24px hsl(0 0% 0% / 0.4)",
              }}
              labelStyle={{ color: "hsl(0 0% 95%)" }}
              itemStyle={{ color: "hsl(156 98% 40%)" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Equity"]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(156 98% 34%)"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
