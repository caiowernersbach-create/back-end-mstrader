export type Asset = {
  id: string;
  assetSymbol: string;
};

const mockAssets: Asset[] = [
  { id: "asset-1", assetSymbol: "EURUSD" },
  { id: "asset-2", assetSymbol: "GBPUSD" },
  { id: "asset-3", assetSymbol: "USDJPY" },
  { id: "asset-4", assetSymbol: "AUDUSD" },
  { id: "asset-5", assetSymbol: "USDCAD" }
];

export const assetService = {
  async getAssetsByAccount(accountId: string): Promise<Asset[]> {
    // Always return assets, even if accountId is undefined
    return Promise.resolve(mockAssets);
  }
};