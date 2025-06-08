import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Label } from '../ui/Label';
import { EnhancedInput } from '../ui/EnhancedInput';
import { cn } from '../../lib/utils';
import { IconBrandGithub, IconBrandGoogle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';
import { registerSchema, RegisterFormData } from '../../utils/validation';
import { motion } from 'framer-motion';

interface RegisterProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export const Register: React.FC<RegisterProps> = ({
  onSuccess,
  onToggleForm,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const {
    isLoading,
    error: authError,
    isAuthenticated,
    user,
  } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle successful registration and redirect
  useEffect(() => {
    if (isAuthenticated && onSuccess && user) {
      // Set flag to prevent duplicate toasts from other components
      sessionStorage.setItem('justRegistered', 'true');
      // Clear auth toast flag since user is now authenticated
      sessionStorage.removeItem('authToastShown');

      // Remove loading toast if exists
      if (loadingToastId) {
        toast.updateToast(loadingToastId, {
          type: 'success',
          title: `Welcome to SaaS Blueprint, ${user.name}!`,
          message:
            'Your account has been created successfully. Please check your email to verify your account.',
          action: {
            label: 'Continue to Dashboard',
            onClick: () => {
              toast.removeToast(loadingToastId);
              onSuccess();
            },
          },
        });

        // Auto-remove the success toast after 3 seconds and redirect
        setTimeout(() => {
          toast.removeToast(loadingToastId);
          setLoadingToastId(null);
          onSuccess();
        }, 3000);
      } else {
        // Fallback if no loading toast
        toast.success(
          `Welcome to SaaS Blueprint, ${user.name}!`,
          'Your account has been created successfully. Please check your email to verify your account.',
          {
            duration: 3000,
            action: {
              label: 'Continue',
              onClick: () => onSuccess(),
            },
          }
        );

        // Auto-redirect after showing the success message
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    }
  }, [isAuthenticated, onSuccess, user, toast, loadingToastId]);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      // Remove loading toast and show error
      if (loadingToastId) {
        toast.updateToast(loadingToastId, {
          type: 'error',
          title: 'Registration failed',
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
        toast.error('Registration failed', getErrorMessage(authError), {
          duration: 4000,
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
      error.toLowerCase().includes('email already exists') ||
      error.toLowerCase().includes('already registered') ||
      error.toLowerCase().includes('email already in use')
    ) {
      return 'An account with this email already exists. Please use a different email or try signing in instead.';
    }
    if (
      error.toLowerCase().includes('weak password') ||
      error.toLowerCase().includes('password requirements')
    ) {
      return 'Password does not meet security requirements. Please ensure it has 8+ characters, uppercase, lowercase, and a number.';
    }
    if (error.toLowerCase().includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (
      error.toLowerCase().includes('name') &&
      error.toLowerCase().includes('required')
    ) {
      return 'Please enter your full name.';
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
    return (
      error ||
      'Registration failed. Please check your information and try again.'
    );
  };

  const onSubmit = async (data: RegisterFormData) => {
    // Clear any previous errors
    dispatch(clearError());

    // Destructure and remove confirmPassword for API call
    const { confirmPassword, ...userData } = data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void confirmPassword; // Acknowledge that confirmPassword is intentionally unused

    // Show loading toast with shorter duration since it will be updated or removed
    const loadingId = toast.loading(
      'Creating your account...',
      'Please wait while we set up your new SaaS Blueprint Generator account.',
      {
        duration: 0, // Set to 0 so it stays until manually removed or updated
      }
    );
    setLoadingToastId(loadingId);

    try {
      await dispatch(registerUser(userData)).unwrap();
      // Success is handled in useEffect
    } catch (error: unknown) {
      // Error is handled in useEffect
    }
  };

  // Handle social login attempts
  const handleSocialLogin = (provider: 'github' | 'google') => {
    toast.info(
      `${provider === 'github' ? 'GitHub' : 'Google'} Sign Up`,
      'Social authentication will be available soon. For now, please use email and password to create your account.',
      {
        duration: 3000,
        action: {
          label: 'Got it',
          onClick: () => {},
        },
      }
    );
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
        Welcome to SaaS Blueprint
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Sign up to start creating amazing SaaS projects with AI assistance
      </p>

      <form
        className="my-8"
        onSubmit={handleSubmit(onSubmit, handleFormErrors)}
      >
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <EnhancedInput
              {...register('name')}
              id="firstname"
              placeholder="John"
              type="text"
              autoComplete="given-name"
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <EnhancedInput
              id="lastname"
              placeholder="Doe"
              type="text"
              autoComplete="family-name"
            />
          </LabelInputContainer>
        </div>
        {errors.name && (
          <p className="text-red-400 text-sm font-medium animate-fade-in mb-4">
            {errors.name.message}
          </p>
        )}

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
              autoComplete="new-password"
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

        <LabelInputContainer className="mb-4">
          <Label htmlFor="confirmpassword">Confirm Password</Label>
          <div className="relative">
            <EnhancedInput
              {...register('confirmPassword')}
              id="confirmpassword"
              placeholder="••••••••"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-10"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm font-medium animate-fade-in">
              {errors.confirmPassword.message}
            </p>
          )}
        </LabelInputContainer>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            <>
              Sign up &rarr;
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
              Sign up with GitHub
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
              Sign up with Google
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>

      {/* Terms */}
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          By creating an account, you agree to our{' '}
          <Link
            to="/terms"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            to="/privacy"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
          >
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Sign in link */}
      <div className="text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Already have an account?{' '}
          {onToggleForm ? (
            <button
              type="button"
              onClick={onToggleForm}
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </button>
          ) : (
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          )}
        </p>
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};
