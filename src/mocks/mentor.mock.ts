// Mock Mentor Relationships Data - Prepared for future backend integration

export interface MockMentorRelationship {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  lastActivity: string;
  joinedAt: string;
}

export interface MockStudentStats {
  studentId: string;
  winRate: number;
  avgR: number;
  totalTrades: number;
  status: 'active' | 'inactive';
}

export const mockMentorRelationships: MockMentorRelationship[] = [
  {
    id: 'rel_001',
    mentorId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    studentId: 'usr_s1t2u3d4-e5n6-7890-abcd-ef1234567892',
    studentName: 'Sarah Learning',
    studentEmail: 'sarah@marketsync.com',
    status: 'APPROVED',
    lastActivity: '2024-12-18T14:30:00Z',
    joinedAt: '2024-03-10T14:30:00Z'
  },
  {
    id: 'rel_002',
    mentorId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    studentId: 'usr_s2t3u4d5-e6n7-7890-abcd-ef1234567893',
    studentName: 'Alex Novice',
    studentEmail: 'alex@marketsync.com',
    status: 'APPROVED',
    lastActivity: '2024-12-17T10:15:00Z',
    joinedAt: '2024-04-05T09:15:00Z'
  },
  {
    id: 'rel_003',
    mentorId: 'usr_m1e2n3t4-o5r6-7890-abcd-ef1234567891',
    studentId: 'usr_s3t4u5d6-e7n8-7890-abcd-ef1234567894',
    studentName: 'Emma Beginner',
    studentEmail: 'emma@marketsync.com',
    status: 'PENDING',
    lastActivity: '2024-12-15T16:45:00Z',
    joinedAt: '2024-05-12T11:45:00Z'
  }
];

export const mockStudentStats: MockStudentStats[] = [
  {
    studentId: 'usr_s1t2u3d4-e5n6-7890-abcd-ef1234567892',
    winRate: 62.5,
    avgR: 1.45,
    totalTrades: 48,
    status: 'active'
  },
  {
    studentId: 'usr_s2t3u4d5-e6n7-7890-abcd-ef1234567893',
    winRate: 55.0,
    avgR: 1.20,
    totalTrades: 32,
    status: 'active'
  },
  {
    studentId: 'usr_s3t4u5d6-e7n8-7890-abcd-ef1234567894',
    winRate: 48.0,
    avgR: 0.85,
    totalTrades: 15,
    status: 'inactive'
  }
];

// Mentor's ID for sharing with students
export const mentorShareId = 'MNT-STERLING-2024';
