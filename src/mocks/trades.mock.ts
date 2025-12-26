import { Trade } from "@/types/trade";

export const tradesMock: Trade[] = [
  {
    id: "T001",
    date: "2024-12-08",
    asset: "NQ",
    direction: "LONG",
    strategyId: "S1",
    rr: 2.3,
    result: 690,
    emotion: "IN",
    management: "IN",
    image: "/mock/trade1.png",
    notes: "Breakout with volume"
  },
];
