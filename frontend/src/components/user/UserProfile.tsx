import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Settings,
  Shield,
  ArrowLeft,
  Sparkles,
  UserCircle,
  Mail,
  Eye,
  EyeOff,
  Calendar,
  Save,
  X,
  Edit3,
  CheckCircle,
  AlertCircle,
  Key,
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

  // State management
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'preferences'
  >('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  // Reset profile form when user data changes or when entering edit mode
  useEffect(() => {
    if (user && isEditing) {
      setProfileValue('name', user.name || '');
      setProfileValue('email', user.email || '');
    }
  }, [user, isEditing, setProfileValue]);

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
      setIsEditing(false);
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

      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

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
  const handleCancelEdit = () => {
    setIsEditing(false);
    resetProfile({ name: user?.name || '', email: user?.email || '' });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-dark relative pl-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-6"
        >
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-dark-text-secondary hover:text-neon-blue transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-neon-blue" />
            <h1 className="text-xl font-bold text-dark-text-primary">
              Account Settings
            </h1>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-80 p-6 border-r border-dark-border"
          >
            {/* User Avatar Card */}
            <div className="bg-dark-accent rounded-2xl p-6 mb-6 border border-dark-border">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-purple-500 rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-neon-blue rounded-full border-2 border-dark-accent flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-dark-text-primary mb-1">
                  {user?.name}
                </h3>
                <p className="text-sm text-dark-text-secondary mb-2">
                  {user?.email}
                </p>
                <div className="flex items-center space-x-2">
                  {user?.isEmailVerified ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Unverified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-2">
              {[
                { id: 'profile', label: 'Profile Info', icon: UserCircle },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'preferences', label: 'Preferences', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as 'profile' | 'security' | 'preferences'
                    )
                  }
                  className={cn(
                    'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                      : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-input-bg'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className="bg-dark-accent rounded-2xl border border-dark-border p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-dark-text-primary">
                          Profile Information
                        </h2>
                        <p className="text-dark-text-secondary">
                          Manage your account details
                        </p>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <form
                        onSubmit={handleProfileSubmit(onProfileSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <UILabel className="text-dark-text-primary">
                              Full Name
                            </UILabel>
                            <EnhancedInput
                              {...registerProfile('name')}
                              placeholder="Enter your full name"
                              className="bg-dark-input-bg border-dark-border"
                            />
                            {profileErrors.name && (
                              <p className="text-red-400 text-sm flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {profileErrors.name.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <UILabel className="text-dark-text-primary">
                              Email Address
                            </UILabel>
                            <EnhancedInput
                              {...registerProfile('email')}
                              placeholder="Enter your email"
                              type="email"
                              className="bg-dark-input-bg border-dark-border"
                            />
                            {profileErrors.email && (
                              <p className="text-red-400 text-sm flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {profileErrors.email.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-6">
                          <button
                            type="submit"
                            disabled={updateLoading}
                            className="flex items-center space-x-2 px-6 py-3 bg-neon-blue hover:bg-neon-blue/80 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updateLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'linear',
                                  }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 px-6 py-3 bg-dark-input-bg hover:bg-dark-input-bg/80 text-dark-text-primary border border-dark-border rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                            <UserCircle className="w-5 h-5 text-neon-blue" />
                            <div>
                              <p className="text-sm text-dark-text-secondary">
                                Full Name
                              </p>
                              <p className="font-semibold text-dark-text-primary">
                                {user?.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                            <Mail className="w-5 h-5 text-neon-blue" />
                            <div>
                              <p className="text-sm text-dark-text-secondary">
                                Email Address
                              </p>
                              <p className="font-semibold text-dark-text-primary">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                            <Calendar className="w-5 h-5 text-neon-blue" />
                            <div>
                              <p className="text-sm text-dark-text-secondary">
                                Member Since
                              </p>
                              <p className="font-semibold text-dark-text-primary">
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

                          <div className="flex items-center space-x-3 p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                            <Shield className="w-5 h-5 text-neon-blue" />
                            <div>
                              <p className="text-sm text-dark-text-secondary">
                                Account Status
                              </p>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-dark-text-primary">
                                  {user?.isEmailVerified
                                    ? 'Verified'
                                    : 'Pending Verification'}
                                </p>
                                {user?.isEmailVerified ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-orange-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className="bg-dark-accent rounded-2xl border border-dark-border p-6 h-full">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-dark-text-primary">
                        Security Settings
                      </h2>
                      <p className="text-dark-text-secondary">
                        Manage your password and account security
                      </p>
                    </div>

                    <form
                      onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <UILabel className="text-dark-text-primary">
                            Current Password
                          </UILabel>
                          <div className="relative">
                            <EnhancedInput
                              {...registerPassword('currentPassword')}
                              placeholder="Enter current password"
                              type={showCurrentPassword ? 'text' : 'password'}
                              className="bg-dark-input-bg border-dark-border pr-12"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary hover:text-neon-blue transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.currentPassword && (
                            <p className="text-red-400 text-sm flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {passwordErrors.currentPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <UILabel className="text-dark-text-primary">
                              New Password
                            </UILabel>
                            <div className="relative">
                              <EnhancedInput
                                {...registerPassword('newPassword')}
                                placeholder="Enter new password"
                                type={showNewPassword ? 'text' : 'password'}
                                className="bg-dark-input-bg border-dark-border pr-12"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary hover:text-neon-blue transition-colors"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <p className="text-red-400 text-sm flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {passwordErrors.newPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <UILabel className="text-dark-text-primary">
                              Confirm New Password
                            </UILabel>
                            <div className="relative">
                              <EnhancedInput
                                {...registerPassword('confirmPassword')}
                                placeholder="Confirm new password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="bg-dark-input-bg border-dark-border pr-12"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary hover:text-neon-blue transition-colors"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="text-red-400 text-sm flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {passwordErrors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex items-center space-x-2 px-6 py-3 bg-neon-blue hover:bg-neon-blue/80 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {passwordLoading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4" />
                              <span>Update Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Security Status */}
                    <div className="mt-8 p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                      <h3 className="font-semibold text-dark-text-primary mb-3">
                        Security Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-dark-text-secondary">
                            Email Verification
                          </span>
                          {user?.isEmailVerified ? (
                            <span className="text-green-400 flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-orange-400 flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-dark-text-secondary">
                            Account Security
                          </span>
                          <span className="text-green-400 flex items-center space-x-1">
                            <Shield className="w-4 h-4" />
                            <span>Strong</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className="bg-dark-accent rounded-2xl border border-dark-border p-6 h-full">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-dark-text-primary">
                        Preferences
                      </h2>
                      <p className="text-dark-text-secondary">
                        Customize your experience
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                        <h3 className="font-semibold text-dark-text-primary mb-3">
                          Theme Settings
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-dark-text-secondary">
                            Dark Mode
                          </span>
                          <div className="w-4 h-4 bg-neon-blue rounded-full"></div>
                        </div>
                      </div>

                      <div className="p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                        <h3 className="font-semibold text-dark-text-primary mb-3">
                          Notifications
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-dark-text-secondary">
                              Email Notifications
                            </span>
                            <span className="text-green-400">Enabled</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-dark-text-secondary">
                              Push Notifications
                            </span>
                            <span className="text-green-400">Enabled</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-dark-input-bg rounded-lg border border-dark-border">
                        <h3 className="font-semibold text-dark-text-primary mb-3">
                          Language & Region
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-dark-text-secondary">
                              Language
                            </span>
                            <span className="text-dark-text-primary">
                              English (US)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-dark-text-secondary">
                              Timezone
                            </span>
                            <span className="text-dark-text-primary">
                              UTC-8 (PST)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
