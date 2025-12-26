import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Calendar,
  BookOpen,
  Settings,
  Users,
  Plus,
  List,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: List, label: "Tracker", path: "/tracker" },
  { icon: Plus, label: "New Trade", path: "/trade/new" },
  { icon: TrendingUp, label: "Trades", path: "/trades" },
  { icon: CalendarDays, label: "Calendar", path: "/calendar" },
  { icon: LineChart, label: "Overview", path: "/overview" },
  { icon: Calendar, label: "Annual", path: "/annual" },
  { icon: BookOpen, label: "Strategies", path: "/strategies" },
  { icon: Users, label: "Mentor", path: "/mentor" },
  { icon: GraduationCap, label: "Educational", path: "/educational" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Market Sync</h1>
            <p className="text-xs text-muted-foreground">Trading Journal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn(
                  "relative z-10 h-5 w-5 transition-colors",
                  isActive && "text-primary"
                )} />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 h-6 w-1 rounded-l-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              TR
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">Trader</p>
              <p className="truncate text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
