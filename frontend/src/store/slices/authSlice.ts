import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI, tokenManager } from '../../utils/api';
import { LoginFormData, RegisterFormData } from '../../utils/validation';
import { User } from '../../types/auth';

// Auth state interface
export interface AuthState {
  user: User | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initial state
const initialState: AuthState = {
  user: tokenManager.getStoredUser(),
  tokens:
    tokenManager.getAccessToken() && tokenManager.getRefreshToken()
      ? {
          accessToken: tokenManager.getAccessToken()!,
          refreshToken: tokenManager.getRefreshToken()!,
        }
      : null,
  isLoading: false,
  error: null,
  isAuthenticated: !!(
    tokenManager.getAccessToken() && tokenManager.getStoredUser()
  ),
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginFormData, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    userData: Omit<RegisterFormData, 'confirmPassword'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authAPI.getProfile();
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get user data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await authAPI.logout();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Logout failed';
    throw errorMessage;
  }
});

export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.refreshToken();
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Token refresh failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const user = await authAPI.verifyEmail(token);
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Email verification failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const resendEmailVerification = createAsyncThunk(
  'auth/resendEmailVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      await authAPI.resendEmailVerification(email);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to resend verification email';
      return rejectWithValue(errorMessage);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send password reset email';
      return rejectWithValue(errorMessage);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    data: { token: string; newPassword: string; confirmPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await authAPI.resetPassword(
        data.token,
        data.newPassword,
        data.confirmPassword
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Password reset failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        tokens: { accessToken: string; refreshToken: string };
      }>
    ) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
      state.error = null;
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      tokenManager.setStoredUser(user);
    },
    logout: state => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      tokenManager.clearTokens();
      // Clear session flags to allow fresh authentication toasts
      sessionStorage.removeItem('authToastShown');
      sessionStorage.removeItem('justRegistered');
    },
    resetAuthState: state => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      tokenManager.clearTokens();
      // Clear session flags to allow fresh authentication toasts
      sessionStorage.removeItem('authToastShown');
      sessionStorage.removeItem('justRegistered');
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.tokens = action.payload.data.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.tokens = action.payload.data.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, state => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        tokenManager.clearTokens();
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, state => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      // Clear session flags to allow fresh authentication toasts
      sessionStorage.removeItem('authToastShown');
      sessionStorage.removeItem('justRegistered');
    });

    // Refresh token
    builder
      .addCase(refreshUserToken.pending, state => {
        state.isLoading = true;
      })
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.tokens = action.payload.data.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshUserToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        tokenManager.clearTokens();
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.isEmailVerified = true;
        }
        // Also update stored user
        if (action.payload) {
          tokenManager.setStoredUser(action.payload);
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend email verification
    builder
      .addCase(resendEmailVerification.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendEmailVerification.fulfilled, state => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendEmailVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, state => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials, logout, resetAuthState } =
  authSlice.actions;
export default authSlice.reducer;
 