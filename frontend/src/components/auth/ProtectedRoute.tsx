import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useToastContext } from '../providers/ToastProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  // Handle authentication required toast
  useEffect(() => {
    if (requireAuth && !isAuthenticated && !isLoading) {
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
          'Please sign in to access this page and continue using SaaS Blueprint Generator.',
          {
            duration: 3000,
            action: {
              label: 'Sign In',
              onClick: () => {
                // Navigation is handled by the redirect below
              },
            },
          }
        );

        // Set flags to prevent duplicate toasts
        sessionStorage.setItem('authToastShown', 'true');
        localStorage.setItem('lastAuthToastTime', currentTime.toString());
      }
    }
  }, [requireAuth, isAuthenticated, isLoading, toast]);

  // Handle already authenticated toast
  useEffect(() => {
    if (!requireAuth && isAuthenticated && !isLoading) {
      toast.info(
        'Already signed in',
        'You are already signed in. Redirecting to your dashboard.',
        {
          action: {
            label: 'Continue',
            onClick: () => (window.location.href = '/dashboard'),
          },
        }
      );
    }
  }, [requireAuth, isAuthenticated, isLoading, toast]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required and user is authenticated
  // (e.g., login/register pages when already logged in)
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard or intended page
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
