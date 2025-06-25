import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { IconLayoutNavbarCollapse } from '@tabler/icons-react';
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Link } from 'react-router-dom';

import { useCallback } from 'react';

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  const [isDimmed, setIsDimmed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    setIsDimmed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsDimmed(true);
    }, 5000); // 5 seconds
  }, []);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Initial load animation
    const loadTimer = window.setTimeout(() => {
      setHasLoaded(true);
    }, 300); // Small delay for smoother initial load

    resetTimer();

    return () => {
      clearTimeout(loadTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return (
    <motion.div
      onMouseEnter={handleActivity}
      onMouseMove={handleActivity}
      onClick={handleActivity}
      initial={{
        x: -80,
        opacity: 0,
        scale: 0.7,
      }}
      animate={{
        x: isDimmed ? -20 : 0,
        scale: isDimmed ? 0.8 : hasLoaded ? 1 : 0.7,
        opacity: isDimmed ? 0.3 : hasLoaded ? 1 : 0,
      }}
      transition={{
        duration: hasLoaded ? 0.5 : 0.8,
        ease: hasLoaded ? 'easeInOut' : 'easeOut',
        delay: hasLoaded ? 0 : 0.2,
      }}
      className="origin-left"
    >
      <FloatingDockDesktop
        items={items}
        className={desktopClassName}
        onActivity={handleActivity}
        hasLoaded={hasLoaded}
      />
      <FloatingDockMobile
        items={items}
        className={mobileClassName}
        onActivity={handleActivity}
        hasLoaded={hasLoaded}
      />
    </motion.div>
  );
};

const FloatingDockMobile = ({
  items,
  className,
  onActivity,
  hasLoaded,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  }[];
  className?: string;
  onActivity?: () => void;
  hasLoaded?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const isVertical = className?.includes('vertical');

  return (
    <div className={cn('relative block md:hidden', className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className={cn(
              'absolute gap-3 flex',
              isVertical
                ? 'right-full mr-3 flex-col inset-y-0'
                : 'inset-x-0 bottom-full mb-3 flex-col'
            )}
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.8,
                  transition: {
                    delay: idx * 0.03,
                  },
                }}
                transition={{
                  delay: (items.length - 1 - idx) * 0.05,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
              >
                {item.onClick ? (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      item.onClick!(e);
                      onActivity?.();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-accent border border-dark-border hover:border-neon-blue/50 hover:bg-dark-input-bg transition-colors duration-200 group"
                  >
                    <div className="h-5 w-5 text-dark-text-secondary group-hover:text-neon-blue transition-colors duration-200">
                      {item.icon}
                    </div>
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    key={item.title}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-accent border border-dark-border hover:border-neon-blue/50 hover:bg-dark-input-bg transition-colors duration-200 group"
                    onClick={onActivity}
                  >
                    <div className="h-5 w-5 text-dark-text-secondary group-hover:text-neon-blue transition-colors duration-200">
                      {item.icon}
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => {
          setOpen(!open);
          onActivity?.();
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: hasLoaded ? 1 : 0.8,
          opacity: hasLoaded ? 1 : 0,
        }}
        transition={{
          delay: hasLoaded ? 0 : 0.5,
          duration: 0.3,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-accent border border-dark-border hover:border-neon-blue/50 hover:bg-dark-input-bg transition-colors duration-200"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-dark-text-secondary hover:text-neon-blue transition-colors duration-200" />
      </motion.button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  onActivity,
  hasLoaded,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  }[];
  className?: string;
  onActivity?: () => void;
  hasLoaded?: boolean;
}) => {
  const isVertical = className?.includes('vertical');
  let mouseX = useMotionValue(Infinity);
  let mouseY = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={e => {
        if (isVertical) {
          mouseY.set(e.pageY);
        } else {
          mouseX.set(e.pageX);
        }
        onActivity?.();
      }}
      onMouseLeave={() => {
        mouseX.set(Infinity);
        mouseY.set(Infinity);
      }}
      className={cn(
        'mx-auto hidden md:flex border',
        isVertical
          ? 'w-16 flex-col items-center gap-3 rounded-2xl bg-dark-accent border-dark-border px-3 py-4'
          : 'h-16 items-end gap-3 rounded-2xl bg-dark-accent border-dark-border px-4 pb-3',
        className
      )}
    >
      {items.map((item, idx) => (
        <IconContainer
          mouseX={mouseX}
          mouseY={mouseY}
          isVertical={isVertical}
          onActivity={onActivity}
          hasLoaded={hasLoaded}
          itemIndex={idx}
          key={item.title}
          {...item}
        />
      ))}
    </motion.div>
  );
};

const IconContainer = ({
  mouseX,
  mouseY,
  isVertical,
  title,
  icon,
  href,
  onClick,
  onActivity,
  hasLoaded,
  itemIndex,
}: {
  mouseX: MotionValue;
  mouseY?: MotionValue;
  isVertical?: boolean;
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  onActivity?: () => void;
  hasLoaded?: boolean;
  itemIndex?: number;
}) => {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(isVertical ? mouseY || mouseX : mouseX, val => {
    let bounds = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    if (isVertical) {
      return val - bounds.y - bounds.height / 2;
    } else {
      return val - bounds.x - bounds.width / 2;
    }
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 32, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 32, 20]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
    onActivity?.();
  };

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => {
        setHovered(true);
        onActivity?.();
      }}
      onMouseLeave={() => setHovered(false)}
      initial={{
        opacity: 0,
        scale: 0.5,
        y: isVertical ? 20 : 0,
        x: isVertical ? 0 : 20,
      }}
      animate={{
        opacity: hasLoaded ? 1 : 0,
        scale: hasLoaded ? 1 : 0.5,
        y: 0,
        x: 0,
      }}
      transition={{
        delay: hasLoaded ? 0 : 0.4 + (itemIndex || 0) * 0.1,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="relative flex aspect-square items-center justify-center rounded-xl bg-dark-input-bg border border-dark-border hover:border-neon-blue/50 hover:bg-dark-accent transition-colors duration-200 group"
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute w-fit rounded-lg border bg-dark-accent px-3 py-1.5 text-xs font-medium whitespace-nowrap text-dark-text-primary border-dark-border z-50',
              isVertical
                ? 'left-full ml-3 top-1/2 -translate-y-1/2'
                : '-top-10 left-1/2 -translate-x-1/2'
            )}
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center text-dark-text-secondary group-hover:text-neon-blue transition-colors duration-200"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={handleClick} className="block">
        {content}
      </button>
    );
  }

  return (
    <Link to={href} onClick={handleClick}>
      {content}
    </Link>
  );
};
