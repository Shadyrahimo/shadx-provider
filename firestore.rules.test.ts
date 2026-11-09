/**
 * Security Rules Verification Suite (Phase 0 & Phase 5 Red Team Audit)
 * Validates that all "Dirty Dozen" attack payloads in security_spec.md
 * are rejected with PERMISSION_DENIED by firestore.rules.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  path: string;
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Owner Role on Registration',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      email: 'user1@example.com',
      displayName: 'Test User',
      storeName: 'Test Store',
      contactInfo: '+966500000000',
      role: 'owner',
      accountStatus: 'pending',
      planTier: 'pro',
      subscriptionEndsAt: '2027-01-01',
      notes: '',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-Activated Account Status on Registration',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      email: 'user1@example.com',
      displayName: 'Test User',
      storeName: 'Test Store',
      contactInfo: '+966500000000',
      role: 'merchant',
      accountStatus: 'active',
      planTier: 'pro',
      subscriptionEndsAt: '2027-01-01',
      notes: '',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow/Ghost Field Injection (isVerified: true)',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      email: 'user1@example.com',
      displayName: 'Test User',
      storeName: 'Test Store',
      contactInfo: '',
      role: 'merchant',
      accountStatus: 'pending',
      planTier: 'starter',
      subscriptionEndsAt: '2027-01-01',
      notes: '',
      isVerified: true,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Identity Spoofing - Creating Profile for Another UID',
    operation: 'create',
    path: '/users/user_2',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      uid: 'user_2',
      email: 'user1@example.com',
      displayName: 'Spoofed',
      storeName: 'Spoofed Store',
      contactInfo: '',
      role: 'merchant',
      accountStatus: 'pending',
      planTier: 'starter',
      subscriptionEndsAt: '2027-01-01',
      notes: '',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Email Spoofing - Unverified Owner Email',
    operation: 'get',
    path: '/users/user_2',
    auth: { uid: 'attacker_1', email: 'shadyrahimo@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'PII Blanket Read - Merchant Reading Another Merchant Profile',
    operation: 'get',
    path: '/users/user_2',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unauthorized List Scraping by Non-Owner',
    operation: 'list',
    path: '/users',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Merchant Privilege Escalation on Update (Setting accountStatus to active)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      accountStatus: 'active',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Update While in Suspended Terminal State',
    operation: 'update',
    path: '/users/user_suspended',
    auth: { uid: 'user_suspended', email: 'suspended@example.com', email_verified: true },
    payload: {
      storeName: 'Updated Store While Suspended',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immortal Field Mutation (Changing createdAt on Update)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      storeName: 'Valid Store',
      createdAt: '2026-12-31T00:00:00Z',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Forged Client Timestamp on Update',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      storeName: 'Valid Store',
      updatedAt: '2099-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value/Size Poisoning (Oversized storeName > 120 chars)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      storeName: 'X'.repeat(500),
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
