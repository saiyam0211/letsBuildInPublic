import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getCurrentUser, resetAuthState } from '../../store/slices/authSlice';
import { tokenManager } from '../../utils/api';
import { useToastContext } from '../providers/ToastProvider';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = tokenManager.getAccessToken();
      const storedUser = tokenManager.getStoredUser();

      if (accessToken && storedUser) {
        try {
          // Verify token is still valid by getting fresh user data
          await dispatch(getCurrentUser()).unwrap();
        } catch (error: unknown) {
          // Token is invalid, clear everything
          dispatch(resetAuthState());
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = tokenManager.getAccessToken();
      const storedUser = tokenManager.getStoredUser();

      // If we have tokens but no user data in Redux, try to fetch user
      if (accessToken && !user) {
        try {
          await dispatch(getCurrentUser()).unwrap();

          // Welcome back toast for successful token validation (only for returning users)
          if (storedUser) {
            const justRegistered = sessionStorage.getItem('justRegistered');
            if (!justRegistered) {
              // Clear auth toast flag since user is now authenticated
              sessionStorage.removeItem('authToastShown');

              toast.success(
                `Welcome back, ${storedUser.name}!`,
                'Your session has been restored successfully. All your data is ready.',
                {
                  duration: 4000,
                  action: {
                    label: 'Go to Dashboard',
                    onClick: () => (window.location.href = '/dashboard'),
                  },
                }
              );
            } else {
              // Clear the flag after using it
              sessionStorage.removeItem('justRegistered');
              // Also clear auth toast flag since user is now authenticated
              sessionStorage.removeItem('authToastShown');
            }
          }
        } catch (error: unknown) {
          // If token is invalid, clear everything and show error
          dispatch(resetAuthState());

          toast.error(
            'Authentication Error',
            'There was a problem verifying your session. Please try signing in again.',
            {
              duration: 4000,
              action: {
                label: 'Retry',
                onClick: () => {
                  dispatch(getCurrentUser());
                },
              },
            }
          );
        }
      }

      // If we have no tokens but Redux thinks we're authenticated, reset state
      if (!accessToken && isAuthenticated) {
        dispatch(resetAuthState());

        // Check if we've already shown an auth toast in this session
        const authToastShown = sessionStorage.getItem('authToastShown');
        const lastToastTime = localStorage.getItem('lastAuthToastTime');
        const currentTime = Date.now();

        // Only show if not shown in this session and it's been more than 30 seconds since last auth toast
        if (
          !authToastShown &&
          (!lastToastTime || currentTime - parseInt(lastToastTime) > 30000)
        ) {
          toast.warning(
            'Authentication Required',
            'Please sign in to access your dashboard and continue building your SaaS project.',
            {
              duration: 3000,
              action: {
                label: 'Sign In',
                onClick: () => {
                  // This could navigate to login page if needed
                },
              },
            }
          );

          // Set flags to prevent duplicate toasts
          sessionStorage.setItem('authToastShown', 'true');
          localStorage.setItem('lastAuthToastTime', currentTime.toString());
        }
      } else if (user && !user.isEmailVerified) {
        // Only show email verification reminder for returning users, not just after registration
        const justRegistered = sessionStorage.getItem('justRegistered');
        const lastEmailVerificationToast = localStorage.getItem(
          'lastEmailVerificationToast'
        );
        const currentTime = Date.now();

        // Only show if it's been more than 5 minutes since last toast and not just registered
        if (
          !justRegistered &&
          (!lastEmailVerificationToast ||
            currentTime - parseInt(lastEmailVerificationToast) > 5 * 60 * 1000)
        ) {
          toast.info(
            'Email Verification Pending',
            `Please check your email (${user.email}) and click the verification link to complete your account setup.`,
            {
              duration: 3000,
              action: {
                label: 'Resend Email',
                onClick: () => {
                  toast.info(
                    'Verification email',
                    'A new verification email has been sent to your inbox.'
                  );
                },
              },
            }
          );

          // Update the last toast timestamp
          localStorage.setItem(
            'lastEmailVerificationToast',
            currentTime.toString()
          );
        }
      }
    };

    initializeAuth();
  }, [dispatch, user, isAuthenticated, toast]);

  return <>{children}</>;
};
