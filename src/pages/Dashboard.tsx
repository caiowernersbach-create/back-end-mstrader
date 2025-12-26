import { useQuery } from "@tanstack/react-query";
import { tradeService } from "@/services";

export default function Dashboard() {
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: tradeService.getAll
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total trades: {trades.length}</p>
    </div>
  );
}
