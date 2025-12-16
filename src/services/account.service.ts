import { PrismaClient } from '../prisma';

const prisma = new PrismaClient();

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
  async createAccount(accountData: CreateAccountDto) {
    try {
      // Validate risk management fields
      if (!accountData.stopLossPerTrade || accountData.stopLossPerTrade <= 0) {
        throw new Error('Stop loss per trade must be a positive number');
      }

      if (!accountData.dailyStopLimit || accountData.dailyStopLimit <= 0) {
        throw new Error('Daily stop limit must be a positive number');
      }

      return prisma.account.create({
        data: {
          userId: accountData.userId,
          accountName: accountData.accountName,
          stopLossPerTrade: accountData.stopLossPerTrade,
          dailyStopLimit: accountData.dailyStopLimit,
          currency: accountData.currency || 'USD',
          riskModel: accountData.riskModel || {},
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Failed to create account');
    }
  }

  async getUserAccounts() {
    try {
      // In a real implementation, you would get the current user's ID
      // For now, we'll return all active accounts
      return prisma.account.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  async getAccountById(id: string) {
    try {
      return prisma.account.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error('Failed to fetch account');
    }
  }

  async updateAccount(id: string, accountData: UpdateAccountDto) {
    try {
      // Validate risk management fields if provided
      if (accountData.stopLossPerTrade !== undefined && accountData.stopLossPerTrade <= 0) {
        throw new Error('Stop loss per trade must be a positive number');
      }

      if (accountData.dailyStopLimit !== undefined && accountData.dailyStopLimit <= 0) {
        throw new Error('Daily stop limit must be a positive number');
      }

      return prisma.account.update({
        where: { id },
        data: accountData,
      });
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  async deleteAccount(id: string) {
    try {
      return prisma.account.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  async getAccountRiskSettings(id: string) {
    try {
      return prisma.account.findUnique({
        where: { id },
        select: {
          id: true,
          accountName: true,
          stopLossPerTrade: true,
          dailyStopLimit: true,
          currency: true,
        },
      });
    } catch (error) {
      console.error('Error fetching account risk settings:', error);
      throw new Error('Failed to fetch account risk settings');
    }
  }
}

export const accountService = new AccountService();