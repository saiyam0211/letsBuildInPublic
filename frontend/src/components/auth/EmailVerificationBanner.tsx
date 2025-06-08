import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resendEmailVerification } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';

export const EmailVerificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  if (!user || user.isEmailVerified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);

    const loadingId = toast.loading(
      'Sending verification email...',
      'Please wait while we send a new verification email to your inbox.'
    );

    try {
      await dispatch(resendEmailVerification(user.email)).unwrap();

      toast.updateToast(loadingId, {
        type: 'success',
        title: 'Verification email sent!',
        message: `A new verification email has been sent to ${user.email}. Please check your inbox and spam folder.`,
        action: {
          label: 'Got it',
          onClick: () => toast.removeToast(loadingId),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send verification email. Please try again.';

      toast.updateToast(loadingId, {
        type: 'error',
        title: 'Failed to send email',
        message: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => {
            toast.removeToast(loadingId);
            handleResendVerification();
          },
        },
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    toast.info(
      'Verification reminder dismissed',
      'You can still verify your email from your profile settings.',
      {
        action: {
          label: 'Go to Profile',
          onClick: () => (window.location.href = '/profile'),
        },
      }
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.3 }}
        className="bg-yellow-900/30 border-b border-yellow-500/30 text-yellow-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Please verify your email address to unlock all features.
                </p>
                <p className="text-xs text-yellow-200 mt-1">
                  Check your inbox at{' '}
                  <span className="font-semibold">{user.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-yellow-200 hover:text-white text-sm font-medium underline flex items-center space-x-1 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <AlertCircle className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Resend email</span>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="text-yellow-200 hover:text-white p-1 rounded"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
