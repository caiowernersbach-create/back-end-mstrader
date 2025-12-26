import { tradesMock } from "@/mocks/trades.mock";
import { Trade } from "@/types/trade";

export const tradeService = {
  async getAll(): Promise<Trade[]> {
    return Promise.resolve(tradesMock);
  },

  async getById(id: string): Promise<Trade | undefined> {
    return tradesMock.find(t => t.id === id);
  },

  async create(trade: Trade): Promise<void> {
    console.log("Mock create trade", trade);
  }
};
