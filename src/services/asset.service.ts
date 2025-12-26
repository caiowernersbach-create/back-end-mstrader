export const assetService = {
  async getAll(): Promise<string[]> {
    return Promise.resolve(["NQ", "ES", "CL", "GC"]);
  }
};
