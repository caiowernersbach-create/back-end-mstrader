export type Account = {
  id: string;
  accountName: string;
  stopLossPerTrade: number;
  dailyStopLimit: number;
  currency: string;
};

const mockAccounts: Account[] = [
  { 
    id: "acc-1", 
    accountName: "Main Account", 
    stopLossPerTrade: 100, 
    dailyStopLimit: 500, 
    currency: "USD" 
  },
  { 
    id: "acc-2", 
    accountName: "Secondary Account", 
    stopLossPerTrade: 50, 
    dailyStopLimit: 200, 
    currency: "USD" 
  }
];

export const accountService = {
  async getUserAccounts(): Promise<Account[]> {
    return Promise.resolve(mockAccounts);
  }
};