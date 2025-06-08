import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  User,
} from '../types/auth';

// Extend axios config to include retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setStoredUser: (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Store toast context globally for API error handling
let toastContext: ToastContextType | null = null;

interface ToastContextType {
  error: (
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => string;
  success: (
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => string;
}

export const setToastContext = (context: ToastContextType) => {
  toastContext = context;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Handle network errors
    if (!error.response) {
      if (toastContext) {
        toastContext.error(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection.',
          {
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          }
        );
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          'http://localhost:5001/api/auth/refresh',
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data.tokens;
        tokenManager.setTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Show success toast for token refresh
        if (toastContext) {
          toastContext.success(
            'Session refreshed',
            'Your session has been automatically renewed.',
            { duration: 3000 }
          );
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Show error toast for token refresh failure
        if (toastContext) {
          toastContext.error(
            'Session expired',
            'Your session has expired. Please sign in again.',
            {
              action: {
                label: 'Sign In',
                onClick: () => (window.location.href = '/login'),
              },
            }
          );
        }

        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      if (toastContext) {
        toastContext.error(
          'Server Error',
          'Something went wrong on our end. Please try again later.',
          {
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          }
        );
      }
    }

    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Handle different status codes
      switch (status) {
        case 400:
          return data?.message || 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication failed. Please log in again.';
        case 403:
          return 'Access denied. You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return data?.message || 'A conflict occurred. Please try again.';
        case 422:
          return data?.message || 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Internal server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return data?.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      return 'Network error. Please check your internet connection and try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Authentication API functions
export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post(
        '/auth/register',
        data
      );
      const { user, tokens } = response.data.data;

      // Store tokens and user data
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenManager.setStoredUser(user);

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post(
        '/auth/login',
        data
      );
      const { user, tokens } = response.data.data;

      // Store tokens and user data
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenManager.setStoredUser(user);

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - we still want to clear local storage
      void error; // Acknowledge error without console logging
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { user: User };
      }> = await api.get('/auth/profile');

      const user = response.data.data.user;
      tokenManager.setStoredUser(user);

      return user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateRequest): Promise<User> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { user: User };
      }> = await api.put('/auth/profile', data);

      const user = response.data.data.user;
      tokenManager.setStoredUser(user);

      return user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await api.put('/auth/password', data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Refresh tokens
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: AxiosResponse<AuthResponse> = await api.post(
        '/auth/refresh',
        {
          refreshToken,
        }
      );

      const { user, tokens } = response.data.data;
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenManager.setStoredUser(user);

      return response.data;
    } catch (error) {
      tokenManager.clearTokens();
      throw handleApiError(error);
    }
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<User> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { user: User };
      }> = await api.get(`/auth/verify-email/${token}`);

      const user = response.data.data.user;
      tokenManager.setStoredUser(user);

      return user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Resend email verification
  resendEmailVerification: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Forgot password - send reset email
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset password with token
  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Log successful API responses in development
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  api.interceptors.response.use(response => {
    void 0; // Replace console.log for production safety
    return response;
  });
}
