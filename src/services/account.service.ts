import { Account } from "@/types/account";

const accountMock: Account = {
  id: "A1",
  name: "Main Account",
  dailyStop: 500,
  tradeStop: 200,
  stopTolerancePercent: 10,
};

export const accountService = {
  async get(): Promise<Account> {
    return Promise.resolve(accountMock);
  }
};
