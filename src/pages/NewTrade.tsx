import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TradeForm } from "@/components/trades/TradeForm";

const NewTrade = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Trade</h1>
          <p className="mt-1 text-muted-foreground">Record your trade with compliance scoring</p>
        </div>
        <TradeForm />
      </div>
    </DashboardLayout>
  );
};

export default NewTrade;
