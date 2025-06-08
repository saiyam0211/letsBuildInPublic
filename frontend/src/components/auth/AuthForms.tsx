import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Login } from './Login';
import { Register } from './Register';

interface AuthFormsProps {
  onSuccess?: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess }) => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');

  // Animation variants
  const formVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 50 : -50,
      y: 20,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -50 : 50,
      y: -10,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    }),
  };

  // Update URL when switching forms
  React.useEffect(() => {
    const newPath = isLogin ? '/login' : '/register';
    if (location.pathname !== newPath) {
      window.history.replaceState(null, '', newPath);
    }
  }, [isLogin, location.pathname]);

  // Sync with URL changes
  React.useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait" custom={isLogin ? 1 : -1}>
        {isLogin ? (
          <motion.div
            key="login"
            custom={1}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <Login onSuccess={onSuccess} onToggleForm={toggleForm} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            custom={-1}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <Register onSuccess={onSuccess} onToggleForm={toggleForm} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
