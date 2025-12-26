export interface Trade {
  id: string;
  date: string;
  asset: string;
  direction: "LONG" | "SHORT";
  strategyId: string;
  rr: number;
  result: number;
  emotion: "IN" | "OUT";
  management: "IN" | "OUT";
  image?: string;
  notes?: string;
}
