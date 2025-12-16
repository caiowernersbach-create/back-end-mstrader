import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAssetDto {
  userId: string;
  assetSymbol: string;
  marketType?: string;
}

export interface UpdateAssetDto {
  assetSymbol?: string;
  marketType?: string;
}

export interface Asset {
  id: string;
  userId: string;
  assetSymbol: string;
  marketType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AssetService {
  async createAsset(assetData: CreateAssetDto) {
    try {
      return prisma.asset.create({
        data: {
          userId: assetData.userId,
          assetSymbol: assetData.assetSymbol,
          marketType: assetData.marketType || 'forex',
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      throw new Error('Failed to create asset');
    }
  }

  async getUserAssets() {
    try {
      // In a real implementation, you would get the current user's ID
      // For now, we'll return all active assets
      return prisma.asset.findMany({
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
        orderBy: { assetSymbol: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching user assets:', error);
      throw new Error('Failed to fetch assets');
    }
  }

  async getAssetsByAccount(accountId: string) {
    try {
      // In a real implementation, you would get assets associated with the account
      // For now, we'll return all active assets
      return prisma.asset.findMany({
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
        orderBy: { assetSymbol: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching assets by account:', error);
      throw new Error('Failed to fetch assets');
    }
  }

  async getAssetById(id: string) {
    try {
      return prisma.asset.findUnique({
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
      console.error('Error fetching asset:', error);
      throw new Error('Failed to fetch asset');
    }
  }

  async updateAsset(id: string, assetData: UpdateAssetDto) {
    try {
      return prisma.asset.update({
        where: { id },
        data: assetData,
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  async deleteAsset(id: string) {
    try {
      return prisma.asset.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error('Failed to delete asset');
    }
  }
}

export const assetService = new AssetService();