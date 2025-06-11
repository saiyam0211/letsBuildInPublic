import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Calendar,
  Palette,
  BellRing,
  Save,
  X,
  Edit3,
  Bell,
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  Monitor,
  Check,
  ExternalLink,
  Key,
  Smartphone,
  Languages,
  ArrowLeft,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getCurrentUser } from '../../store/slices/authSlice';
import { authAPI } from '../../utils/api';
import { Label as UILabel } from '../ui/Label';
import { EnhancedInput } from '../ui/EnhancedInput';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useToastContext } from '../providers/ToastProvider';
import { Link } from 'react-router-dom';

// Validation schemas
const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  // State management - only one form can be edited at a time
  const [activeEditMode, setActiveEditMode] = useState<
    'none' | 'profile' | 'password'
  >('none');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Mark as animated after first render
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 600); // After initial animations complete
    return () => clearTimeout(timer);
  }, []);

  // Computed states
  const isEditingProfile = activeEditMode === 'profile';
  const isChangingPassword = activeEditMode === 'password';

  // Profile update form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Reset profile form when user data changes or when entering edit mode
  useEffect(() => {
    if (user && isEditingProfile) {
      setProfileValue('name', user.name || '');
      setProfileValue('email', user.email || '');
    }
  }, [user, isEditingProfile, setProfileValue]);

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update profile
  const onProfileSubmit = async (data: ProfileUpdateData) => {
    setUpdateLoading(true);

    try {
      await authAPI.updateProfile(data);
      await dispatch(getCurrentUser());
      toast.success(
        'Profile updated successfully!',
        'Your profile information has been saved.',
        { duration: 3000 }
      );
      setActiveEditMode('none');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';
      toast.error('Profile update failed', errorMessage, { duration: 5000 });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Change password
  const onPasswordSubmit = async (data: PasswordChangeData) => {
    setPasswordLoading(true);

    const loadingId = toast.loading(
      'Updating password...',
      'Please wait while we securely update your password.'
    );

    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.updateToast(loadingId, {
        type: 'success',
        title: 'Password updated successfully!',
        message:
          'Your password has been changed. Please use your new password for future logins.',
      });

      setActiveEditMode('none');
      resetPassword();

      setTimeout(() => {
        toast.removeToast(loadingId);
      }, 3000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to change password. Please try again.';
      toast.updateToast(loadingId, {
        type: 'error',
        title: 'Password change failed',
        message: errorMessage,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Cancel handlers
  const handleCancelProfileEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveEditMode('none');
    resetProfile({ name: user?.name || '', email: user?.email || '' });
  };

  const handleCancelPasswordEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveEditMode('none');
    resetPassword();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Reusable Components
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

  // Status Badge Component
  const StatusBadge = ({
    icon: Icon,
    label,
    variant = 'success',
  }: {
    icon: React.ElementType;
    label: string;
    variant?: 'success' | 'warning' | 'info' | 'error';
  }) => {
    const variants = {
      success:
        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      warning:
        'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      error:
        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${variants[variant]}`}
      >
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // Info Card Component
  const InfoCard = ({
    icon: Icon,
    title,
    description,
    children,
    actionButton,
    iconColor = 'bg-gradient-to-br from-blue-500 to-blue-600',
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
    actionButton?: React.ReactNode;
    iconColor?: string;
  }) => (
    <motion.div
      initial={hasAnimated ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group shadow-input rounded-2xl p-6 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              {title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          </div>
        </div>
        {actionButton}
      </div>
      {children}
    </motion.div>
  );

  // Quick Stats Component - Memoized to prevent re-renders
  const QuickStats = React.memo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <motion.div
        initial={hasAnimated ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: hasAnimated ? 0 : 0.1 }}
        className="bg-white dark:bg-black rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 text-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      >
        <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-2" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
          Member Since
        </p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200">
          {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
        </p>
      </motion.div>

      <motion.div
        initial={hasAnimated ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: hasAnimated ? 0 : 0.2 }}
        className="bg-white dark:bg-black rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 text-center hover:border-green-300 dark:hover:border-green-700 transition-colors"
      >
        <Clock className="w-5 h-5 text-green-500 mx-auto mb-2" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
          Last Active
        </p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200">
          Today
        </p>
      </motion.div>

      <motion.div
        initial={hasAnimated ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: hasAnimated ? 0 : 0.3 }}
        className="bg-white dark:bg-black rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 text-center hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
      >
        <Shield className="w-5 h-5 text-purple-500 mx-auto mb-2" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
          Security
        </p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200">
          High
        </p>
      </motion.div>

      <motion.div
        initial={hasAnimated ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: hasAnimated ? 0 : 0.4 }}
        className="bg-white dark:bg-black rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 text-center hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
      >
        <Monitor className="w-5 h-5 text-orange-500 mx-auto mb-2" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
          Sessions
        </p>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200">
          1 Active
        </p>
      </motion.div>
    </div>
  ));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-800 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute h-full w-full bg-white dark:bg-black bg-grid-small-black/[0.2] dark:bg-grid-small-white/[0.2] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/5 dark:via-transparent dark:to-purple-900/5" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-6xl space-y-8">
          {/* Enhanced Header */}
          <motion.div
            initial={hasAnimated ? false : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl font-bold text-neutral-800 dark:text-neutral-200 mb-3 bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg">
              Manage your profile information and security settings
            </p>
          </motion.div>

          {/* Quick Stats */}
          <QuickStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Profile Information Card */}
            <InfoCard
              icon={User}
              title="Profile Information"
              description="Update your account details and personal information"
              iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"
              actionButton={
                !isEditingProfile && (
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      setActiveEditMode('profile');
                    }}
                    disabled={activeEditMode !== 'none'}
                    className="group/btn relative flex items-center space-x-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-black dark:bg-zinc-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                    <BottomGradient />
                  </button>
                )
              }
            >
              <AnimatePresence mode="wait">
                {isEditingProfile ? (
                  <motion.form
                    key="edit"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleProfileSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <LabelInputContainer>
                      <UILabel
                        htmlFor="name"
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        Full Name
                      </UILabel>
                      <EnhancedInput
                        {...registerProfile('name')}
                        id="name"
                        placeholder="Enter your full name"
                        type="text"
                        className="transition-all duration-300"
                      />
                      {profileErrors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {profileErrors.name.message}
                        </motion.p>
                      )}
                    </LabelInputContainer>

                    <LabelInputContainer>
                      <UILabel
                        htmlFor="email"
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        Email Address
                      </UILabel>
                      <EnhancedInput
                        {...registerProfile('email')}
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        className="transition-all duration-300"
                      />
                      {profileErrors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {profileErrors.email.message}
                        </motion.p>
                      )}
                    </LabelInputContainer>

                    <div className="flex space-x-3 pt-6">
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="group/btn relative flex-1 h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        {updateLoading ? (
                          <div className="flex items-center justify-center space-x-2 relative z-10">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            <span>Saving Changes...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2 relative z-10">
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </div>
                        )}
                        <BottomGradient />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        className="group/btn relative flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 border border-gray-300/50 dark:border-gray-600/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </div>
                        <BottomGradient />
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Profile Avatar Section */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div className="relative group">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                          <Camera className="w-3 h-3 text-blue-500" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 text-lg">
                          {user?.name}
                        </h4>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          {user?.role} Account
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Full Name
                        </UILabel>
                        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                          {user?.name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Account Role
                        </UILabel>
                        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                          {user?.role}
                        </p>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Email Address
                        </UILabel>
                        <div className="flex items-center space-x-3">
                          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                            {user?.email}
                          </p>
                          {user?.isEmailVerified ? (
                            <StatusBadge
                              icon={CheckCircle}
                              label="Verified"
                              variant="success"
                            />
                          ) : (
                            <StatusBadge
                              icon={AlertCircle}
                              label="Unverified"
                              variant="warning"
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Member Since
                        </UILabel>
                        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </InfoCard>

            {/* Enhanced Security Settings Card */}
            <InfoCard
              icon={Shield}
              title="Security Settings"
              description="Manage your password and account security"
              iconColor="bg-gradient-to-br from-red-500 to-pink-600"
              actionButton={
                !isChangingPassword && (
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      setActiveEditMode('password');
                    }}
                    disabled={activeEditMode !== 'none'}
                    className="group/btn relative flex items-center space-x-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-black dark:bg-zinc-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4" />
                    <span>Change Password</span>
                    <BottomGradient />
                  </button>
                )
              }
            >
              <AnimatePresence mode="wait">
                {isChangingPassword ? (
                  <motion.form
                    key="password-edit"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <LabelInputContainer>
                      <UILabel
                        htmlFor="currentPassword"
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        Current Password
                      </UILabel>
                      <div className="relative">
                        <EnhancedInput
                          {...registerPassword('currentPassword')}
                          id="currentPassword"
                          placeholder="Enter current password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            setShowCurrentPassword(!showCurrentPassword);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-10"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {passwordErrors.currentPassword.message}
                        </motion.p>
                      )}
                    </LabelInputContainer>

                    <LabelInputContainer>
                      <UILabel
                        htmlFor="newPassword"
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        New Password
                      </UILabel>
                      <div className="relative">
                        <EnhancedInput
                          {...registerPassword('newPassword')}
                          id="newPassword"
                          placeholder="Enter new password"
                          type={showNewPassword ? 'text' : 'password'}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            setShowNewPassword(!showNewPassword);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-10"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {passwordErrors.newPassword.message}
                        </motion.p>
                      )}
                    </LabelInputContainer>

                    <LabelInputContainer>
                      <UILabel
                        htmlFor="confirmPassword"
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        Confirm New Password
                      </UILabel>
                      <div className="relative">
                        <EnhancedInput
                          {...registerPassword('confirmPassword')}
                          id="confirmPassword"
                          placeholder="Confirm new password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            setShowConfirmPassword(!showConfirmPassword);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-10"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {passwordErrors.confirmPassword.message}
                        </motion.p>
                      )}
                    </LabelInputContainer>

                    <div className="flex space-x-3 pt-6">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="group/btn relative flex-1 h-12 bg-gradient-to-r from-red-600 via-red-700 to-pink-700 hover:from-red-700 hover:via-red-800 hover:to-pink-800 font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        {passwordLoading ? (
                          <div className="flex items-center justify-center space-x-2 relative z-10">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            <span>Updating Password...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2 relative z-10">
                            <Save className="w-4 h-4" />
                            <span>Update Password</span>
                          </div>
                        )}
                        <BottomGradient />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPasswordEdit}
                        className="group/btn relative flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 border border-gray-300/50 dark:border-gray-600/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </div>
                        <BottomGradient />
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="security-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                              Password Security
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Strong password protection enabled
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          icon={Check}
                          label="Secure"
                          variant="success"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Last Password Update
                        </UILabel>
                        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                          {user?.updatedAt
                            ? new Date(user.updatedAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <UILabel className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                          Security Score
                        </UILabel>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${user?.isEmailVerified ? 'bg-green-500 w-4/5' : 'bg-orange-500 w-3/5'}`}
                            ></div>
                          </div>
                          <span
                            className={`text-sm font-medium ${user?.isEmailVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
                          >
                            {user?.isEmailVerified ? '85%' : '65%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3">
                        Security Recommendations
                      </h4>
                      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Strong password enabled</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user?.isEmailVerified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Email verification active</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span>Email verification pending</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>
                            Consider enabling two-factor authentication
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </InfoCard>
          </div>

          {/* Enhanced Preferences Card */}
          <InfoCard
            icon={Settings}
            title="Preferences & Settings"
            description="Customize your experience and application settings"
            iconColor="bg-gradient-to-br from-purple-500 to-violet-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated ? 0 : 0.1 }}
                className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  <UILabel className="font-medium text-neutral-800 dark:text-neutral-200">
                    Theme
                  </UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-slate-900 dark:bg-slate-100 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Dark Mode
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated ? 0 : 0.2 }}
                className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl border border-blue-200 dark:border-blue-700"
              >
                <div className="flex items-center space-x-2">
                  <BellRing className="w-5 h-5 text-blue-500" />
                  <UILabel className="font-medium text-neutral-800 dark:text-neutral-200">
                    Notifications
                  </UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge
                    icon={user?.preferences?.notifications ? Bell : BellRing}
                    label={
                      user?.preferences?.notifications ? 'Enabled' : 'Disabled'
                    }
                    variant={
                      user?.preferences?.notifications ? 'success' : 'warning'
                    }
                  />
                </div>
              </motion.div>

              <motion.div
                initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated ? 0 : 0.3 }}
                className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 rounded-xl border border-green-200 dark:border-green-700"
              >
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-green-500" />
                  <UILabel className="font-medium text-neutral-800 dark:text-neutral-200">
                    Language
                  </UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    English (US)
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Additional Settings */}
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-4 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Advanced Settings</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Manage Sessions
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                </button>

                <button className="flex items-center justify-between p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Privacy Settings
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                </button>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};
