import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Eye, EyeOff, Save, Settings, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getCurrentUser, clearError } from '../../store/slices/authSlice';
import { authAPI } from '../../utils/api';
import { Label } from '../ui/Label';
import { EnhancedInput } from '../ui/EnhancedInput';
import { useToastContext } from '../providers/ToastProvider';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
        {
          action: {
            label: 'View Profile',
            onClick: () => window.location.reload(),
          },
        }
      );
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';
      toast.error('Profile update failed', errorMessage, {
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => {
            dispatch(clearError());
          },
        },
      });
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
        action: {
          label: 'Got it',
          onClick: () => toast.removeToast(loadingId),
        },
      });

      setShowPasswordForm(false);
      resetPassword();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to change password. Please try again.';
      toast.error('Password change failed', errorMessage, {
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => {
            dispatch(clearError());
          },
        },
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    resetProfile({
      name: user?.name || '',
      email: user?.email || '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-accent rounded-2xl border border-dark-border p-8 shadow-glow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-neon rounded-xl flex items-center justify-center shadow-glow">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-text-primary">
                  User Profile
                </h1>
                <p className="text-dark-text-secondary">
                  Manage your account information
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-dark-input-bg rounded-lg p-6 border border-dark-border">
              <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
                Basic Information
              </h2>

              {isEditing ? (
                <form
                  onSubmit={handleProfileSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <EnhancedInput
                      {...registerProfile('name')}
                      id="name"
                      placeholder="Enter your full name"
                      type="text"
                    />
                    {profileErrors.name && (
                      <p className="text-red-400 text-sm mt-1">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <EnhancedInput
                      {...registerProfile('email')}
                      id="email"
                      placeholder="Enter your email"
                      type="email"
                    />
                    {profileErrors.email && (
                      <p className="text-red-400 text-sm mt-1">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {updateLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-text-secondary mb-1">
                      Full Name
                    </p>
                    <p className="text-dark-text-primary font-medium">
                      {user?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary mb-1">
                      Email Address
                    </p>
                    <p className="text-dark-text-primary font-medium">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary mb-1">
                      Account Role
                    </p>
                    <p className="text-dark-text-primary font-medium capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary mb-1">
                      Email Status
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.isEmailVerified
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                      }`}
                    >
                      {user?.isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Password Change Section */}
            <div className="bg-dark-input-bg rounded-lg p-6 border border-dark-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-text-primary">
                  Password & Security
                </h2>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <form
                  onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <EnhancedInput
                        {...registerPassword('currentPassword')}
                        id="currentPassword"
                        placeholder="Enter current password"
                        type={showCurrentPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-red-400 text-sm mt-1">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <EnhancedInput
                        {...registerPassword('newPassword')}
                        id="newPassword"
                        placeholder="Enter new password"
                        type={showNewPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-red-400 text-sm mt-1">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <EnhancedInput
                        {...registerPassword('confirmPassword')}
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        type={showConfirmPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        resetPassword();
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-dark-text-secondary">
                  <p>
                    Password was last updated on{' '}
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Account Preferences */}
            <div className="bg-dark-input-bg rounded-lg p-6 border border-dark-border">
              <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
                Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-dark-text-secondary mb-1">Theme</p>
                  <p className="text-dark-text-primary font-medium capitalize">
                    {user?.preferences?.theme || 'Dark'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-text-secondary mb-1">
                    Notifications
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.preferences?.notifications
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
                    }`}
                  >
                    {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-dark-text-secondary mb-1">
                    Language
                  </p>
                  <p className="text-dark-text-primary font-medium">
                    {user?.preferences?.language || 'English'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
