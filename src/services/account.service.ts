// Frontend API Abstraction - Mock Data
export interface CreateAccountDto {
  userId: string;
  accountName: string;
  stopLossPerTrade: number;
  dailyStopLimit: number;
  currency?: string;
  riskModel?: any;
}

export interface UpdateAccountDto {
  accountName?: string;
  stopLossPerTrade?: number;
  dailyStopLimit?: number;
  currency?: string;
  riskModel?: any;
}

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  stopLossPerTrade: number;
  dailyStopLimit: number;
  currency: string;
  riskModel: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AccountService {
  // Mock data for testing
  private mockAccounts = [
    {
      id: 'account-1',
      userId: 'user-1',
      accountName: 'Main Account',
      stopLossPerTrade: 100,
      dailyStopLimit: 500,
      currency: 'USD',
      riskModel: {},
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'account-2',
      userId: 'user-1',
      accountName: 'Secondary Account',
      stopLossPerTrade: 50,
      dailyStopLimit: 200,
      currency: 'USD',
      riskModel: {},
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
    },
  ];

  async createAccount(accountData: CreateAccountDto) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAccount = {
          ...accountData,
          id: `account-${Date.now()}`,
          currency: accountData.currency || 'USD',
          riskModel: accountData.riskModel || {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockAccounts.push(newAccount);
        resolve(newAccount);
      }, 500);
    });
  }

  async getUserAccounts() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activeAccounts = this.mockAccounts.filter(account => account.isActive);
        resolve(activeAccounts);
      }, 300);
    });
  }

  async getAccountById(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const account = this.mockAccounts.find(account => account.id === id && account.isActive);
        resolve(account || null);
      }, 200);
    });
  }

  async updateAccount(id: string, accountData: UpdateAccountDto) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const accountIndex = this.mockAccounts.findIndex(account => account.id === id);
        if (accountIndex !== -1) {
          this.mockAccounts[accountIndex] = {
            ...this.mockAccounts[accountIndex],
            ...accountData,
            updatedAt: new Date(),
          };
          resolve(this.mockAccounts[accountIndex]);
        } else {
          resolve(null);
        }
      }, 400);
    });
  }

  async deleteAccount(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const accountIndex = this.mockAccounts.findIndex(account => account.id === id);
        if (accountIndex !== -1) {
          this.mockAccounts[accountIndex].isActive = false;
          this.mockAccounts[accountIndex].updatedAt = new Date();
          resolve(this.mockAccounts[accountIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }

  async getAccountRiskSettings(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const account = this.mockAccounts.find(account => account.id === id && account.isActive);
        if (account) {
          resolve({
            id: account.id,
            accountName: account.accountName,
            stopLossPerTrade: account.stopLossPerTrade,
            dailyStopLimit: account.dailyStopLimit,
            currency: account.currency,
          });
        } else {
          resolve(null);
        }
      }, 200);
    });
  }
}

export const accountService = new AccountService();