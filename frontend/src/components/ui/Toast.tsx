import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const toastVariants = {
  hidden: {
    opacity: 0,
    y: -100,
    scale: 0.3,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      mass: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    x: 500,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

const progressVariants = {
  initial: { scaleX: 1 },
  animate: (duration: number) => ({
    scaleX: 0,
    transition: {
      duration: duration / 1000,
      ease: 'linear',
    },
  }),
};

const sparkleVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const getToastConfig = (type: ToastData['type']) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        bgGradient: 'from-emerald-500/20 via-green-500/10 to-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        iconColor: 'text-emerald-400',
        glowColor: 'shadow-emerald-500/20',
        progressColor: 'bg-gradient-to-r from-emerald-400 to-green-400',
      };
    case 'error':
      return {
        icon: AlertCircle,
        bgGradient: 'from-red-500/20 via-rose-500/10 to-red-500/20',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        glowColor: 'shadow-red-500/20',
        progressColor: 'bg-gradient-to-r from-red-400 to-rose-400',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgGradient: 'from-amber-500/20 via-yellow-500/10 to-amber-500/20',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        glowColor: 'shadow-amber-500/20',
        progressColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
      };
    case 'info':
      return {
        icon: Info,
        bgGradient: 'from-blue-500/20 via-cyan-500/10 to-blue-500/20',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        glowColor: 'shadow-blue-500/20',
        progressColor: 'bg-gradient-to-r from-blue-400 to-cyan-400',
      };
    case 'loading':
      return {
        icon: Sparkles,
        bgGradient: 'from-purple-500/20 via-indigo-500/10 to-purple-500/20',
        borderColor: 'border-purple-500/30',
        iconColor: 'text-purple-400',
        glowColor: 'shadow-purple-500/20',
        progressColor: 'bg-gradient-to-r from-purple-400 to-indigo-400',
      };
  }
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ toast, onRemove }, ref) => {
    const config = getToastConfig(toast.type);
    const Icon = config.icon;
    const duration = toast.duration || 2000;

    useEffect(() => {
      if (toast.type !== 'loading' && duration > 0) {
        const timer = setTimeout(() => {
          onRemove(toast.id);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [toast.id, toast.type, duration, onRemove]);

    return (
      <motion.div
        ref={ref}
        variants={toastVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`
        relative overflow-hidden
        max-w-md w-full
        bg-gradient-to-br ${config.bgGradient}
        backdrop-blur-xl
        border ${config.borderColor}
        rounded-2xl
        shadow-2xl ${config.glowColor}
        p-4
        group
        cursor-pointer
      `}
        style={{
          perspective: '1000px',
        }}
        onClick={() => onRemove(toast.id)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

        {/* Animated Border */}
        <div className="absolute inset-0 rounded-2xl">
          <div
            className={`absolute inset-0 rounded-2xl border-2 ${config.borderColor} opacity-60`}
          />
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 ${config.borderColor}`}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <motion.div
              className={`${config.iconColor} relative`}
              animate={toast.type === 'loading' ? sparkleVariants.animate : {}}
            >
              <Icon className="w-6 h-6" />
              {toast.type === 'success' && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 ${config.borderColor}`}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.h4
              className="text-white font-semibold text-sm leading-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {toast.title}
            </motion.h4>
            {toast.message && (
              <motion.p
                className="text-gray-300 text-xs mt-1 leading-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {toast.message}
              </motion.p>
            )}

            {/* Action Button */}
            {toast.action && (
              <motion.button
                className={`mt-2 text-xs font-medium ${config.iconColor} hover:opacity-80 transition-opacity`}
                onClick={e => {
                  e.stopPropagation();
                  toast.action!.onClick();
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {toast.action.label}
              </motion.button>
            )}
          </div>

          {/* Close Button */}
          <motion.button
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            onClick={e => {
              e.stopPropagation();
              onRemove(toast.id);
            }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Progress Bar */}
        {toast.type !== 'loading' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b-2xl">
            <motion.div
              className={`h-full ${config.progressColor} origin-left`}
              variants={progressVariants}
              initial="initial"
              animate="animate"
              custom={duration}
            />
          </div>
        )}

        {/* Loading Animation */}
        {toast.type === 'loading' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b-2xl">
            <motion.div
              className={`h-full ${config.progressColor}`}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        )}

        {/* Floating Particles for Success */}
        {toast.type === 'success' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: '100%',
                  opacity: 0,
                }}
                animate={{
                  y: '-20%',
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 -top-2 -bottom-2"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            transform: 'skewX(-20deg)',
          }}
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    );
  }
);

Toast.displayName = 'Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};
 