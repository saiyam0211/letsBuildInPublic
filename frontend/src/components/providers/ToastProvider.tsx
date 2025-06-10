import React, { createContext, useContext, ReactNode } from 'react';
import { useToast, type ToastData } from '../../hooks/useToast';
import { ToastContainer } from '../ui/Toast';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  allowDuplicates?: boolean;
}

interface ToastUpdate {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastContextType = {
  success: (title: string, message?: string, options?: ToastOptions) => string;
  error: (title: string, message?: string, options?: ToastOptions) => string;
  warning: (title: string, message?: string, options?: ToastOptions) => string;
  info: (title: string, message?: string, options?: ToastOptions) => string;
  loading: (title: string, message?: string, options?: ToastOptions) => string;
  updateToast: (id: string, updates: ToastUpdate) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  toasts: ToastData[];
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
 