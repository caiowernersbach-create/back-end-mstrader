export type Asset = {
  id: string;
  assetSymbol: string;
};

const mockAssets: Asset[] = [
  { id: "ast-1", assetSymbol: "EURUSD" },
  { id: "ast-2", assetSymbol: "NAS100" },
  { id: "ast-3", assetSymbol: "SP500" }
];

export const assetService = {
  async getAssetsByAccount(accountId: string): Promise<Asset[]> {
    return Promise.resolve(mockAssets);
  }
};
