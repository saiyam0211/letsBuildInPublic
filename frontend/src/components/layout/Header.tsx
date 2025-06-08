import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'SaaS Blueprint Generator',
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const toast = useToastContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            navigate('/login');
          },
        },
      });

      // Navigate after a short delay to show the success toast
      setTimeout(() => {
        navigate('/login');
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

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Projects',
      href: '/projects',
      current: location.pathname === '/projects',
    },
    {
      name: 'Templates',
      href: '/templates',
      current: location.pathname === '/templates',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      current: location.pathname === '/analytics',
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-dark-accent border-b border-dark-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-neon rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
            </div>
            <div className="hidden md:block ml-4">
              <h1 className="text-xl font-bold text-dark-text-primary">
                {title}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-input-bg'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-input-bg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center space-x-3 p-2 rounded-lg text-dark-text-primary hover:bg-dark-input-bg transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="w-8 h-8 bg-gradient-neon rounded-full flex items-center justify-center shadow-glow">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-dark-text-secondary">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-dark-text-secondary" />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-dark-accent rounded-lg shadow-lg border border-dark-border z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-dark-border">
                      <p className="text-sm font-medium text-dark-text-primary">
                        {user?.name}
                      </p>
                      <p className="text-xs text-dark-text-secondary">
                        {user?.email}
                      </p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        Role: <span className="capitalize">{user?.role}</span>
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-sm text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-input-bg transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profile Settings
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-dark-border">
              {navigationItems.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-600 text-white'
                      : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-input-bg'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
