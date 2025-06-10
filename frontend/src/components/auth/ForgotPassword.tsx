import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Label } from '../ui/Label';
import { EnhancedInput } from '../ui/EnhancedInput';
import { cn } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      // Remove loading toast and show error
      if (loadingToastId) {
        toast.updateToast(loadingToastId, {
          type: 'error',
          title: 'Failed to send reset email',
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
        toast.error('Failed to send reset email', getErrorMessage(authError), {
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
    if (error.toLowerCase().includes('invalid email')) {
      return 'Please enter a valid email address.';
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
    return error || 'Please try again later.';
  };

  const onSubmit = async (data: ForgotPasswordForm) => {
    // Clear any previous errors
    dispatch(clearError());

    // Show loading toast
    const loadingId = toast.loading(
      'Sending reset link...',
      'Please wait while we send you a password reset link.'
    );
    setLoadingToastId(loadingId);

    try {
      await dispatch(forgotPassword(data.email)).unwrap();

      // Update loading toast to success
      toast.updateToast(loadingId, {
        type: 'success',
        title: 'Reset link sent!',
        message: 'Check your email for password reset instructions.',
        action: {
          label: 'Got it',
          onClick: () => {
            toast.removeToast(loadingId);
            setIsSubmitted(true);
          },
        },
      });
      setLoadingToastId(null);

      // Show the success state
      setTimeout(() => {
        setIsSubmitted(true);
      }, 1500);
    } catch (error: unknown) {
      // Error is handled in useEffect
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

  if (isSubmitted) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            Check Your Email
          </h2>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
            We've sent password reset instructions to{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {getValues('email')}
            </span>
          </p>

          <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Next steps:</strong>
              <br />
              1. Check your email inbox (and spam folder)
              <br />
              2. Click the reset link in the email
              <br />
              3. Create a new secure password
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
              type="button"
            >
              Send Another Email &rarr;
              <BottomGradient />
            </button>

            <Link
              to="/login"
              className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Back to Login
              </span>
              <BottomGradient />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Forgot Password?
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        No worries! Enter your email address and we'll send you a link to reset
        your password.
      </p>

      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <LabelInputContainer className="mb-6">
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

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending Reset Link...</span>
            </div>
          ) : (
            <>
              Send Reset Link &rarr;
              <BottomGradient />
            </>
          )}
        </button>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="text-center">
          <Link
            to="/login"
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Back to Login
            </span>
            <BottomGradient />
          </Link>
        </div>
      </form>
    </div>
  );
};
 