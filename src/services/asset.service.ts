// Frontend API Abstraction - Mock Data
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
  // Mock data for testing
  private mockAssets = [
    {
      id: 'asset-1',
      userId: 'user-1',
      assetSymbol: 'EURUSD',
      marketType: 'forex',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'asset-2',
      userId: 'user-1',
      assetSymbol: 'GBPUSD',
      marketType: 'forex',
      isActive: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'asset-3',
      userId: 'user-1',
      assetSymbol: 'USDJPY',
      marketType: 'forex',
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
    },
  ];

  async createAsset(assetData: CreateAssetDto) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAsset = {
          ...assetData,
          id: `asset-${Date.now()}`,
          marketType: assetData.marketType || 'forex',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockAssets.push(newAsset);
        resolve(newAsset);
      }, 500);
    });
  }

  async getUserAssets() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activeAssets = this.mockAssets.filter(asset => asset.isActive);
        resolve(activeAssets);
      }, 300);
    });
  }

  async getAssetsByAccount(accountId: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, return all active assets
        // In real implementation, this would filter by account
        const activeAssets = this.mockAssets.filter(asset => asset.isActive);
        resolve(activeAssets);
      }, 300);
    });
  }

  async getAssetById(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const asset = this.mockAssets.find(asset => asset.id === id && asset.isActive);
        resolve(asset || null);
      }, 200);
    });
  }

  async updateAsset(id: string, assetData: UpdateAssetDto) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assetIndex = this.mockAssets.findIndex(asset => asset.id === id);
        if (assetIndex !== -1) {
          this.mockAssets[assetIndex] = {
            ...this.mockAssets[assetIndex],
            ...assetData,
            updatedAt: new Date(),
          };
          resolve(this.mockAssets[assetIndex]);
        } else {
          resolve(null);
        }
      }, 400);
    });
  }

  async deleteAsset(id: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assetIndex = this.mockAssets.findIndex(asset => asset.id === id);
        if (assetIndex !== -1) {
          this.mockAssets[assetIndex].isActive = false;
          this.mockAssets[assetIndex].updatedAt = new Date();
          resolve(this.mockAssets[assetIndex]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }
}

export const assetService = new AssetService();