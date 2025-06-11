import { AuthService } from '../../services/authService';
import { IUser } from '../../models/User';
import '../setup/emailMock'; // Import email service mock

interface TestUserResult {
  user: IUser;
  token: string;
  refreshToken: string;
}

/**
 * Create a test user and return user data with authentication tokens
 */
export async function createTestUser(userData?: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<TestUserResult> {
  const defaultUserData = {
    email: userData?.email || `test-${Date.now()}@example.com`,
    password: userData?.password || 'SecurePass123!',
    name: userData?.name || 'Test User',
  };

  try {
    const result = await AuthService.register(defaultUserData);

    return {
      user: result.user,
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Create multiple test users for testing scenarios
 */
export async function createTestUsers(
  count: number
): Promise<TestUserResult[]> {
  const users: TestUserResult[] = [];

  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `test-user-${i}-${Date.now()}@example.com`,
      name: `Test User ${i + 1}`,
    });
    users.push(user);
  }

  return users;
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
