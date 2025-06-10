import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthInitializer } from './components/auth/AuthInitializer';
import { AuthLayout } from './components/layout/AuthLayout';
import { AuthForms } from './components/auth/AuthForms';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserProfile } from './components/user/UserProfile';
import {
  ToastProvider,
  useToastContext,
} from './components/providers/ToastProvider';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { logoutUser } from './store/slices/authSlice';
import { EmailVerification } from './components/auth/EmailVerification';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import './index.css';

// Enhanced dashboard component with user info and logout
const DashboardComponent = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  const handleLogout = async () => {
    const loadingId = toast.loading(
      'Signing out...',
      'Please wait while we securely log you out.'
    );

    try {
      await dispatch(logoutUser());

      toast.updateToast(loadingId, {
        type: 'success',
        title: 'Signed out successfully',
        message:
          'You have been securely logged out. Thank you for using SaaS Blueprint Generator!',
        action: {
          label: 'Sign In Again',
          onClick: () => {
            toast.removeToast(loadingId);
            window.location.href = '/login';
          },
        },
      });

      // Navigate after a short delay to show the success toast
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast.updateToast(loadingId, {
        type: 'error',
        title: 'Logout failed',
        message: 'There was an error signing you out. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => {
            toast.removeToast(loadingId);
            handleLogout();
          },
        },
      });
    }
  };

  const demoToasts = () => {
    // Success Toast
    toast.success(
      'Project Created Successfully!',
      'Your new SaaS blueprint has been generated and is ready for deployment.',
      {
        action: {
          label: 'View Project',
          onClick: () => void 0,
        },
      }
    );

    // Error Toast (delayed)
    setTimeout(() => {
      toast.error(
        'API Connection Failed',
        'Unable to connect to the AI service. Please check your internet connection.',
        {
          action: {
            label: 'Retry',
            onClick: () => void 0,
          },
        }
      );
    }, 1000);

    // Warning Toast (delayed)
    setTimeout(() => {
      toast.warning(
        'Storage Almost Full',
        'You have used 85% of your storage quota. Consider upgrading your plan.',
        {
          action: {
            label: 'Upgrade',
            onClick: () => void 0,
          },
        }
      );
    }, 2000);

    // Info Toast (delayed)
    setTimeout(() => {
      toast.info(
        'New Feature Available',
        "We've added AI-powered code generation to your blueprint process!",
        {
          action: {
            label: 'Learn More',
            onClick: () => void 0,
          },
        }
      );
    }, 3000);

    // Loading Toast (delayed)
    setTimeout(() => {
      const loadingId = toast.loading(
        'Generating Blueprint...',
        'Our AI is analyzing your requirements and creating the perfect architecture.'
      );

      // Convert to success after 4 seconds
      setTimeout(() => {
        toast.updateToast(loadingId, {
          type: 'success',
          title: 'Blueprint Generated!',
          message: 'Your comprehensive SaaS architecture is ready for review.',
          action: {
            label: 'View Blueprint',
            onClick: () => toast.removeToast(loadingId),
          },
        });
      }, 4000);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <EmailVerificationBanner />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with user info and logout */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-dark-text-primary">
                Welcome back, {user?.name}! 👋
          </h1>
              <p className="text-dark-text-secondary mt-2">
                Ready to build something amazing?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="bg-dark-accent rounded-2xl border border-dark-border p-8 shadow-glow-lg">
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
              SaaS Blueprint Generator Dashboard
            </h2>

            {/* Toast Demo Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20">
              <h3 className="text-lg font-semibold text-dark-text-primary mb-3 flex items-center">
                ✨ Experience Our Stunning Notifications
              </h3>
              <p className="text-dark-text-secondary mb-4 text-sm">
                Click the button below to see our beautiful toast notification
                system in action with multiple types and animations!
              </p>
              <button
                onClick={demoToasts}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
              >
                🎉 Show Toast Demo
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* User Info Card */}
              <div className="bg-dark-input-bg rounded-lg p-4 border border-dark-border">
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">
                  Account Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-dark-text-secondary">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-dark-text-secondary">
                    <span className="font-medium">Role:</span> {user?.role}
                  </p>
                  <p className="text-dark-text-secondary">
                    <span className="font-medium">Member since:</span>{' '}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <p className="text-dark-text-secondary">
                    <span className="font-medium">Email verified:</span>{' '}
                    <span
                      className={
                        user?.isEmailVerified
                          ? 'text-green-400'
                          : 'text-yellow-400'
                      }
                    >
                      {user?.isEmailVerified ? '✓ Verified' : '⚠ Pending'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-dark-input-bg rounded-lg p-4 border border-dark-border">
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-2 text-sm text-dark-text-secondary">
                  <p>
                    • Projects Created: <span className="text-blue-400">0</span>
                  </p>
                  <p>
                    • Blueprints Generated:{' '}
                    <span className="text-green-400">0</span>
                  </p>
                  <p>
                    • Templates Used: <span className="text-purple-400">0</span>
                  </p>
                  <p>
                    • API Calls This Month:{' '}
                    <span className="text-cyan-400">0</span>
                  </p>
                </div>
              </div>
              </div>

            <div className="bg-dark-input-bg rounded-lg p-6 border border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
                Coming Soon Features:
                </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="text-dark-text-secondary space-y-2">
                  <li>• 🎯 Project creation and management</li>
                  <li>• 🤖 AI-powered idea processing</li>
                  <li>• 📊 Visual blueprint generation</li>
                  <li>• 🔄 Real-time collaboration</li>
                </ul>
                <ul className="text-dark-text-secondary space-y-2">
                  <li>• 📱 Mobile-responsive design</li>
                  <li>• 🚀 One-click deployment</li>
                  <li>• 📈 Analytics and insights</li>
                  <li>• 🎨 Custom templates</li>
                </ul>
              </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthInitializer>
          <div className="dark">
            <Router>
              <Routes>
                {/* Public routes (redirect to dashboard if authenticated) */}
                <Route
                  path="/login"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AuthLayout>
                        <AuthForms
                          onSuccess={() =>
                            (window.location.href = '/dashboard')
                          }
                        />
                      </AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AuthLayout>
                        <AuthForms
                          onSuccess={() =>
                            (window.location.href = '/dashboard')
                          }
                        />
                      </AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AuthLayout>
                        <ForgotPassword />
                      </AuthLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AuthLayout>
                        <ResetPassword />
                      </AuthLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardComponent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/email-verification"
                  element={<EmailVerification />}
                />

                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </div>
        </AuthInitializer>
      </ToastProvider>
    </Provider>
  );
}

export default App;
