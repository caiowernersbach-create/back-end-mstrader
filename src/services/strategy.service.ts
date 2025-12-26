import { strategiesMock } from "@/mocks/strategies.mock";
import { Strategy } from "@/types/strategy";

export const strategyService = {
  async getAll(): Promise<Strategy[]> {
    return Promise.resolve(strategiesMock);
  }
};
