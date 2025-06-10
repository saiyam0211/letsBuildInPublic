import { useState, useCallback, useRef } from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  allowDuplicates?: boolean;
}

interface ToastUpdate {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message?: string;
  action?: ToastAction;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastsRef = useRef<ToastData[]>([]);

  // Keep ref in sync with state
  toastsRef.current = toasts;

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToast = useCallback(
    (
      type: ToastData['type'],
      title: string,
      message?: string,
      options?: ToastOptions
    ): string => {
      if (!options?.allowDuplicates) {
        const existingToast = toastsRef.current.find(
          toast => toast.type === type && toast.title === title
        );
        if (existingToast) {
          return existingToast.id;
        }
      }

      const id = generateId();
      const toast: ToastData = {
        id,
        type,
        title,
        message,
        duration: options?.duration || 2000,
        action: options?.action,
      };

      setToasts(prev => [...prev, toast]);
      return id;
    },
    [generateId]
  );

  const updateToast = useCallback((id: string, updates: ToastUpdate) => {
    setToasts(prev =>
      prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast))
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: ToastOptions): string =>
      addToast('success', title, message, options),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: ToastOptions): string =>
      addToast('error', title, message, options),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: ToastOptions): string =>
      addToast('warning', title, message, options),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: ToastOptions): string =>
      addToast('info', title, message, options),
    [addToast]
  );

  const loading = useCallback(
    (title: string, message?: string, options?: ToastOptions): string =>
      addToast('loading', title, message, options),
    [addToast]
  );

  return {
    toasts,
    success,
    error,
    warning,
    info,
    loading,
    updateToast,
    removeToast,
    clearAll,
  };
};
 