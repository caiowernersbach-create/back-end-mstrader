import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import NewTrade from "./pages/NewTrade";
import Trades from "./pages/Trades";
import Overview from "./pages/Overview";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Annual from "./pages/Annual";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Calendar from "./pages/Calendar";
import Tracker from "./pages/Tracker";
import Mentor from "./pages/Mentor";
import EducationalRoom from "./pages/EducationalRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/trade/new" element={<NewTrade />} />
            <Route path="/trade/:id" element={<NewTrade />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/strategies/:id" element={<StrategyDetail />} />
            <Route path="/annual" element={<Annual />} />
            <Route path="/mentor" element={<Mentor />} />
            <Route path="/educational" element={<EducationalRoom />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
