import { AuthService } from '@/services/authService';
import { IUser } from '@/models/User';
import '../setup/emailMock'; // Import email service mock
import { EmailService } from '@/services/emailService';
import { vi } from 'vitest';

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

  // Mock email service in test environment to prevent actual email sending
  const originalSendVerificationEmail = EmailService.sendVerificationEmail;
  if (process.env.NODE_ENV === 'test') {
    EmailService.sendVerificationEmail = vi.fn().mockResolvedValue(undefined);
  }

  try {
    const result = await AuthService.register(defaultUserData);

    // In test environment, automatically verify the user to skip email verification
    if (process.env.NODE_ENV === 'test' && result.user) {
      result.user.isEmailVerified = true;
      await result.user.save();
    }

    return {
      user: result.user,
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    // Restore original method
    if (process.env.NODE_ENV === 'test') {
      EmailService.sendVerificationEmail = originalSendVerificationEmail;
    }
  }
}

/**
 * Login with existing test user
 */
export async function loginTestUser(email: string, password: string) {
  const result = await AuthService.login({ email, password });
  return {
    user: result.user,
    token: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  };
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
