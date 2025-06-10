import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { verifyEmail, clearError } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';

export const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const dispatch = useAppDispatch();
  const toast = useToastContext();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmailToken = async () => {
      try {
        dispatch(clearError());
        await dispatch(verifyEmail(token)).unwrap();

        setVerificationStatus('success');
        toast.success(
          'Email verified successfully!',
          'Your email has been verified. You can now access all features of your account.',
          {
            duration: 5000,
            action: {
              label: 'Go to Dashboard',
              onClick: () => (window.location.href = '/dashboard'),
            },
          }
        );
      } catch (error: unknown) {
        setVerificationStatus('error');
        const errorMsg =
          error instanceof Error ? error.message : 'Email verification failed';
        setErrorMessage(errorMsg);

        toast.error('Email verification failed', errorMsg, {
          duration: 5000,
          action: {
            label: 'Contact Support',
            onClick: () => {
              // Could open a support contact form
            },
          },
        });
      }
    };

    verifyEmailToken();
  }, [searchParams, dispatch, toast]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Loader2 className="w-full h-full text-blue-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
              Verifying Your Email
            </h2>
            <p className="text-dark-text-secondary">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <CheckCircle className="w-full h-full text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
              Email Verified Successfully!
            </h2>
            <p className="text-dark-text-secondary mb-6">
              Your email has been verified. You'll be redirected to your
              dashboard in a few seconds.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <XCircle className="w-full h-full text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
              Verification Failed
            </h2>
            <p className="text-dark-text-secondary mb-6">{errorMessage}</p>

            <div className="mt-6">
              <button
                onClick={() => (window.location.href = '/login')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-dark-card backdrop-blur-xl border border-dark-border rounded-2xl p-8">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};
 