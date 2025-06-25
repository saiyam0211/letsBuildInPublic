import React from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import {
  IconHome,
  IconBulb,
  IconFolder,
  IconChartBar,
  IconSettings,
  IconUser,
  IconLogout,
} from '@tabler/icons-react';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { useToastContext } from '../providers/ToastProvider';

export default function FloatingDockDemo() {
  const dispatch = useAppDispatch();
  const toast = useToastContext();

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

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
          },
        },
      });
    }
  };

  const links = [
    {
      title: 'Home',
      icon: <IconHome className="h-full w-full" />,
      href: '/',
    },
    {
      title: 'Process Ideas',
      icon: <IconBulb className="h-full w-full" />,
      href: '/process-idea',
    },
    {
      title: 'Dashboard',
      icon: <IconFolder className="h-full w-full" />,
      href: '/dashboard',
    },
    {
      title: 'Analytics',
      icon: <IconChartBar className="h-full w-full" />,
      href: '/analytics',
    },
    {
      title: 'Settings',
      icon: <IconSettings className="h-full w-full" />,
      href: '/settings',
    },
    {
      title: 'Profile',
      icon: <IconUser className="h-full w-full" />,
      href: '/profile',
    },
    {
      title: 'Logout',
      icon: <IconLogout className="h-full w-full" />,
      href: '#',
      onClick: handleLogout,
    },
  ];

  return (
    <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50">
      <FloatingDock
        items={links}
        desktopClassName="vertical-dock"
        mobileClassName="vertical-dock-mobile"
      />
    </div>
  );
}
