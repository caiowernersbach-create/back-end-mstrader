export type Strategy = {
  id: string;
  strategyName: string;
};

const mockStrategies: Strategy[] = [
  { id: "str-1", strategyName: "Breakout London" },
  { id: "str-2", strategyName: "NY Reversal" },
  { id: "str-3", strategyName: "Trend Continuation" }
];

export const strategyService = {
  async getUserStrategies(): Promise<Strategy[]> {
    return Promise.resolve(mockStrategies);
  }
};