// Mock Assets Data - Prepared for future backend integration

export interface MockAsset {
  id: string;
  symbol: string;
  name: string;
  tickValue: number;
  category: 'futures' | 'forex' | 'stocks' | 'crypto';
}

export const mockAssets: MockAsset[] = [
  {
    id: 'ast_es001',
    symbol: 'ES',
    name: 'E-mini S&P 500',
    tickValue: 12.50,
    category: 'futures'
  },
  {
    id: 'ast_nq001',
    symbol: 'NQ',
    name: 'E-mini Nasdaq 100',
    tickValue: 5.00,
    category: 'futures'
  },
  {
    id: 'ast_cl001',
    symbol: 'CL',
    name: 'Crude Oil',
    tickValue: 10.00,
    category: 'futures'
  },
  {
    id: 'ast_gc001',
    symbol: 'GC',
    name: 'Gold',
    tickValue: 10.00,
    category: 'futures'
  },
  {
    id: 'ast_eurusd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    tickValue: 10.00,
    category: 'forex'
  },
  {
    id: 'ast_gbpusd',
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    tickValue: 10.00,
    category: 'forex'
  },
  {
    id: 'ast_btcusd',
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    tickValue: 1.00,
    category: 'crypto'
  },
  {
    id: 'ast_aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    tickValue: 0.01,
    category: 'stocks'
  }
];
