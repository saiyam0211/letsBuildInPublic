import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetPassword, clearError } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';
import { EnhancedInput } from '../ui/EnhancedInput';
import { Label } from '../ui/Label';
import { cn } from '../../lib/utils';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])/,
        'Password must contain at least one lowercase letter'
      )
      .regex(
        /^(?=.*[A-Z])/,
        'Password must contain at least one uppercase letter'
      )
      .regex(/^(?=.*\d)/, 'Password must contain at least one number')
      .regex(
        /^(?=.*[@$!%*?&])/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const { success, error: showError, loading, removeToast } = useToastContext();

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      showError(
        'Invalid Reset Link',
        'The password reset link is invalid or missing.',
        { duration: 5000 }
      );
      navigate('/login');
    }
  }, [token, showError, navigate]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    // Show loading toast
    const loadingToastId = loading(
      'Resetting Password...',
      'Please wait while we update your password.',
      { duration: 0 } // Don't auto-dismiss loading toast
    );

    try {
      dispatch(clearError());
      await dispatch(
        resetPassword({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        })
      ).unwrap();

      // Remove loading toast
      removeToast(loadingToastId);

      // Show success toast
      success(
        'Password Reset Successfully!',
        'Your password has been updated. You can now sign in with your new password.',
        { duration: 3000 }
      );

      // Show success screen after toast is visible
      setTimeout(() => {
        setIsSuccess(true);
      }, 2000);
    } catch (error: unknown) {
      // Remove loading toast
      removeToast(loadingToastId);

      setIsSuccess(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Password reset failed. Please try again.';
      showError('Failed to reset password', errorMessage, {
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => {
            setIsSuccess(false);
          },
        },
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return 'Very Weak';
    }
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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

  if (isSuccess) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center mb-2 text-neutral-800 dark:text-neutral-200"
        >
          Password Reset Complete!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-600 dark:text-neutral-300 text-center mb-8 leading-relaxed"
        >
          Your password has been successfully updated. You can now sign in with
          your new password.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => navigate('/login')}
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-emerald-600 to-green-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:from-emerald-700 hover:to-green-700 transition-all duration-300"
          >
            Continue to Sign In
            <BottomGradient />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8">
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
        Reset Your Password
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Create a new secure password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="my-8">
        <LabelInputContainer className="mb-4">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <EnhancedInput
              {...register('newPassword')}
              id="newPassword"
              placeholder="Enter your new password"
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
          {errors.newPassword && (
            <p className="text-red-400 text-sm font-medium animate-fade-in">
              {errors.newPassword.message}
            </p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-6">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <EnhancedInput
              {...register('confirmPassword')}
              id="confirmPassword"
              placeholder="Confirm your new password"
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

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-400/30 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting Password...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Reset Password</span>
              </div>
              <BottomGradient />
            </>
          )}
        </button>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors duration-300 flex items-center justify-center gap-2 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};
