// Mock Users Data - Prepared for future backend integration

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'TRADER' | 'MENTOR' | 'STUDENT';
  mentorId?: string;
  subscriptionTier: 'basic' | 'pro' | 'master';
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'John Trader',
    email: 'john@marketsync.com',
    role: 'TRADER',
    subscriptionTier: 'pro',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    name: 'Michael Sterling',
    email: 'michael@marketsync.com',
    role: 'MENTOR',
    subscriptionTier: 'master',
    createdAt: '2023-06-20T08:00:00Z'
  },
  {
    id: 'usr_s1t2u3d4-e5n6-7890-abcd-ef1234567892',
    name: 'Sarah Learning',
    email: 'sarah@marketsync.com',
    role: 'STUDENT',
    mentorId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    subscriptionTier: 'basic',
    createdAt: '2024-03-10T14:30:00Z'
  },
  {
    id: 'usr_s2t3u4d5-e6n7-7890-abcd-ef1234567893',
    name: 'Alex Novice',
    email: 'alex@marketsync.com',
    role: 'STUDENT',
    mentorId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    subscriptionTier: 'basic',
    createdAt: '2024-04-05T09:15:00Z'
  },
  {
    id: 'usr_s3t4u5d6-e7n8-7890-abcd-ef1234567894',
    name: 'Emma Beginner',
    email: 'emma@marketsync.com',
    role: 'STUDENT',
    subscriptionTier: 'basic',
    createdAt: '2024-05-12T11:45:00Z'
  }
];

// Current active user (can be switched for testing different roles)
export const currentUserId = 'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const mentorUserId = 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891';
export const studentUserId = 'usr_s1t2u3d4-e5n6-7890-abcd-ef1234567892';
