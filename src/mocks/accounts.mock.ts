// Mock Trading Accounts Data - Prepared for future backend integration

export interface MockAccount {
  id: string;
  userId: string;
  name: string;
  stopLossValue: number;
  dailyStopLimit: number;
  stopErrorMarginPercent: number;
  createdAt: string;
}

export const mockAccounts: MockAccount[] = [
  {
    id: 'acc_1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    userId: 'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Main Trading Account',
    stopLossValue: 100,
    dailyStopLimit: 500,
    stopErrorMarginPercent: 10,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'acc_2b3c4d5e-6f7a-8901-bcde-f12345678901',
    userId: 'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Swing Trading Account',
    stopLossValue: 200,
    dailyStopLimit: 1000,
    stopErrorMarginPercent: 15,
    createdAt: '2024-02-20T14:30:00Z'
  },
  {
    id: 'acc_3c4d5e6f-7a8b-9012-cdef-123456789012',
    userId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    name: 'Mentor Demo Account',
    stopLossValue: 150,
    dailyStopLimit: 750,
    stopErrorMarginPercent: 12,
    createdAt: '2023-06-20T08:00:00Z'
  }
];
