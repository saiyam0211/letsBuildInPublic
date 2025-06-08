import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '../ui/Label';
import { EnhancedInput } from '../ui/EnhancedInput';
import { cn } from '../../lib/utils';
import { IconBrandGithub, IconBrandGoogle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { loginSchema, type LoginFormData } from '../../utils/validation';
import { useToastContext } from '../providers/ToastProvider';

interface LoginProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onToggleForm }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const {
    isLoading,
    error: authError,
    isAuthenticated,
    user,
  } = useAppSelector(state => state.auth);
  const toast = useToastContext();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && onSuccess && user) {
      // Clear auth toast flag since user is now authenticated
      sessionStorage.removeItem('authToastShown');

      // Remove loading toast if exists
      if (loadingToastId) {
        toast.updateToast(loadingToastId, {
          type: 'success',
          title: `Welcome back, ${user.name}!`,
          message:
            'You have been successfully signed in to your SaaS Blueprint Generator account.',
          action: {
            label: 'Continue to Dashboard',
            onClick: () => {
              toast.removeToast(loadingToastId);
              onSuccess();
            },
          },
        });
        setLoadingToastId(null);
      } else {
        // Fallback if no loading toast
        toast.success(
          `Welcome back, ${user.name}!`,
          'You have been successfully signed in to your SaaS Blueprint Generator account.',
          {
            duration: 3000,
            action: {
              label: 'Continue to Dashboard',
              onClick: () => onSuccess(),
            },
          }
        );
      }

      // Small delay before calling onSuccess to show the toast
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [isAuthenticated, onSuccess, user, toast, loadingToastId]);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      // Remove loading toast and show error
      if (loadingToastId) {
        toast.updateToast(loadingToastId, {
          type: 'error',
          title: 'Sign in failed',
          message: getErrorMessage(authError),
          action: {
            label: 'Try Again',
            onClick: () => {
              toast.removeToast(loadingToastId);
              dispatch(clearError());
            },
          },
        });
        setLoadingToastId(null);
      } else {
        // Fallback error toast
        toast.error('Sign in failed', getErrorMessage(authError), {
          duration: 3000,
          action: {
            label: 'Try Again',
            onClick: () => dispatch(clearError()),
          },
        });
      }
    }
  }, [authError, toast, dispatch, loadingToastId]);

  // Function to get user-friendly error messages
  const getErrorMessage = (error: string) => {
    if (
      error.toLowerCase().includes('invalid credentials') ||
      error.toLowerCase().includes('incorrect email') ||
      error.toLowerCase().includes('incorrect password') ||
      error.toLowerCase().includes('user not found')
    ) {
      return 'The email or password you entered is incorrect. Please try again.';
    }
    if (
      error.toLowerCase().includes('account not verified') ||
      error.toLowerCase().includes('email not verified')
    ) {
      return 'Please verify your email address before logging in. Check your inbox for a verification link.';
    }
    if (
      error.toLowerCase().includes('account locked') ||
      error.toLowerCase().includes('too many attempts')
    ) {
      return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later.';
    }
    if (
      error.toLowerCase().includes('network') ||
      error.toLowerCase().includes('connection')
    ) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    if (
      error.toLowerCase().includes('server error') ||
      error.toLowerCase().includes('500')
    ) {
      return 'Server temporarily unavailable. Please try again in a few moments.';
    }
    return error || 'An unexpected error occurred. Please try again.';
  };

  // Handle form validation errors
  const handleFormErrors = (
    formErrors: Record<string, { message?: string }>
  ) => {
    const errorFields = Object.keys(formErrors);
    if (errorFields.length > 0) {
      toast.warning(
        'Please check your input',
        `Please fix the errors in: ${errorFields.join(', ')}`,
        {
          duration: 5000,
          action: {
            label: 'Got it',
            onClick: () => {},
          },
        }
      );
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    // Clear any previous errors
    dispatch(clearError());

    // Show loading toast
    const loadingId = toast.loading(
      'Signing in...',
      'Please wait while we verify your credentials and sign you in.',
      {
        duration: 1000,
      }
    );
    setLoadingToastId(loadingId);

    try {
      const response = await dispatch(loginUser(data)).unwrap();
      toast.updateToast(loadingId, {
        type: 'success',
        title: 'Welcome back!',
        message: `Successfully logged in as ${response.data.user.name}. Redirecting to your dashboard...`,
        action: {
          label: 'Go to Dashboard',
          onClick: () => {
            toast.removeToast(loadingId);
            navigate('/dashboard');
          },
        },
      });

      // Navigate after showing success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: unknown) {
      // Error handling is managed by useEffect monitoring authError
    }
  };

  // Handle social login attempts
  const handleSocialLogin = (provider: 'github' | 'google') => {
    toast.info(
      `${provider === 'github' ? 'GitHub' : 'Google'} Sign In`,
      'Social authentication will be available soon. For now, please use your email and password to sign in.',
      {
        duration: 3000,
        action: {
          label: 'Got it',
          onClick: () => {},
        },
      }
    );
  };

  const BottomGradient = () => {
    return (
      <>
        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
      </>
    );
  };

  const LabelInputContainer = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div className={cn('flex w-full flex-col space-y-2', className)}>
        {children}
      </div>
    );
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome back to SaaS Blueprint
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Sign in to continue building amazing SaaS projects
      </p>

      <form
        className="my-8"
        onSubmit={handleSubmit(onSubmit, handleFormErrors)}
      >
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <EnhancedInput
            {...register('email')}
            id="email"
            placeholder="hello@example.com"
            type="email"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-400 text-sm font-medium animate-fade-in">
              {errors.email.message}
            </p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <EnhancedInput
              {...register('password')}
              id="password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-10"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm font-medium animate-fade-in">
              {errors.password.message}
            </p>
          )}
        </LabelInputContainer>

        {/* Forgot Password */}
        <div className="flex justify-end mb-6">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              Sign in &rarr;
              <BottomGradient />
            </>
          )}
        </button>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            type="button"
            onClick={() => handleSocialLogin('github')}
          >
            <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Continue with GitHub
            </span>
            <BottomGradient />
          </button>
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            type="button"
            onClick={() => handleSocialLogin('google')}
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Continue with Google
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>

      {/* Sign up link */}
      <div className="text-center mt-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Don't have an account?{' '}
          {onToggleForm ? (
            <button
              type="button"
              onClick={onToggleForm}
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Create account
            </button>
          ) : (
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Create account
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};
