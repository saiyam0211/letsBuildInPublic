import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart, Monitor, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { EnhancedIdeaForm } from '../components/ui/enhanced-idea-form';
import { TextRevealCard } from '../components/ui/text-reveal-card';
import { FollowerPointerCard } from '../components/ui/following-pointer';
import { AnimatedTooltip } from '../components/ui/animated-tooltip';
import { MultiStepLoader } from '../components/ui/multi-step-loader';
import arrowAnimation from '../../public/arrow.json';
import circleAnimation from '../../public/circle.json';

const LandingPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Performance monitoring
  const { isSlowConnection } = usePerformanceMonitor();

  const placeholderTexts = useMemo(
    () => [
      'A Netflix for fitness classes with AI personal trainers...',
      'A CRM for solo creators managing their brand partnerships...',
      'An AI assistant for project managers in remote teams...',
      'A Shopify for digital course creators and educators...',
      'A Slack alternative with built-in productivity tracking...',
    ],
    []
  );

  // SaaS Blueprint Generation Steps
  const loadingStates = useMemo(
    () => [
      {
        text: 'Analyzing your SaaS idea...',
      },
      {
        text: 'Researching target market & competitors',
      },
      {
        text: 'Identifying key user personas',
      },
      {
        text: 'Defining core features & MVP scope',
      },
      {
        text: 'Selecting optimal tech stack',
      },
      {
        text: 'Creating monetization strategy',
      },
      {
        text: 'Building go-to-market plan',
      },
      {
        text: 'Generating your complete blueprint ✨',
      },
    ],
    []
  );

  const processSteps = useMemo(
    () => [
      {
        id: 1,
        name: 'Market Analysis',
        icon: <BarChart className="w-6 h-6" />,
      },
      {
        id: 2,
        name: 'Tech Stack',
        icon: <Monitor className="w-6 h-6" />,
      },
      {
        id: 3,
        name: 'User Research',
        icon: <Users className="w-6 h-6" />,
      },
      {
        id: 4,
        name: 'Growth Plan',
        icon: <TrendingUp className="w-6 h-6" />,
      },
    ],
    []
  );

  // Generate floating particles
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      })),
    []
  );

  // Handle form submission for the enhanced idea form
  const handleIdeaSubmit = useCallback(
    (businessIdea: string) => {
      if (!businessIdea.trim()) return;

      setIsGenerating(true);

      // Show the multi-step loader for the blueprint generation process
      setTimeout(
        () => {
          setIsGenerating(false);
          navigate('/process-idea', { state: { idea: businessIdea } });
        },
        isSlowConnection ? 16000 : 12000
      ); // Show all 8 steps (8 * 1.5s = 12s)
    },
    [navigate, isSlowConnection]
  );

  return (
    <div className="h-screen overflow-hidden bg-gradient-dark relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Multi-Step Loader for SaaS Blueprint Generation */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isGenerating}
        duration={1500}
        loop={false}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main Content - Single Screen Layout */}
      <div className="relative z-10 h-full flex flex-col -mt-32 items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
        {/* Hero Headline */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-6 sm:mb-20 "
        >
          {/* Interactive Text Reveal with Sparkle Trail */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-gray-300"
          >
            <div className="flex items-center justify-center">
              <TextRevealCard
                text="You know what you want."
                revealText="We know how to ship it."
                className="w-full"
              ></TextRevealCard>
            </div>
          </motion.div>
        </motion.div>

        {/* Central Input Form Card */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-2xl w-full mb-6 sm:mb-8"
        >
          {/* Playful Doodle Arrow with Enhanced Styling */}
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{
              delay: 1,
              duration: 0.8,
              type: 'spring',
              bounce: 0.4,
            }}
            className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:block"
          >
            <div className="relative">
              {/* Lottie animation for the arrow - plays continuously */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <Lottie
                  animationData={arrowAnimation}
                  loop={false}
                  autoplay={true}
                  style={{ width: '100px', height: '70px', rotate: '180deg' }}
                />
              </motion.div>

              {/* Redesigned "Start here!" text to match arrow style */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="absolute -top-5 -left-10 whitespace-nowrap"
              >
                {/* Circle Lottie animation wrapper */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    width: '120px',
                    height: '60px',
                    left: '-20px',
                    top: '-10px',
                  }}
                >
                  <Lottie
                    animationData={circleAnimation}
                    loop={true}
                    autoplay={true}
                    style={{ width: '120px', height: '60px' }}
                  />
                </motion.div>

                {/* Clean background with subtle styling */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.5 }}
                  className="absolute -inset-2  rounded-lg "
                />

                {/* Main text with clean styling */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.6 }}
                  className="relative z-10 text-white text-sm font-medium py-1.5 inline-block"
                  style={{
                    fontFamily: "'Doodle', 'Comic Sans MS', cursive",
                    letterSpacing: '0.025em',
                    marginTop: '4px',
                  }}
                >
                  Start here!
                </motion.span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Form Card with Vanish Input */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative max-w-2xl w-full mb-6 sm:mb-8"
        >
          <FollowerPointerCard title="Start your SaaS journey! ✨">
            <div className=" backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-3 mb-5">
                  <label className="block text-sm text-center font-medium text-gray-300">
                    Describe your SaaS idea
                  </label>

                  {/* Enhanced Idea Form */}
                  <EnhancedIdeaForm
                    placeholders={placeholderTexts}
                    onSubmit={handleIdeaSubmit}
                  />
                </div>
              </div>
            </div>
          </FollowerPointerCard>
        </motion.div>

        {/* Process Visualization with AnimatedTooltip */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="fixed bottom-20 left-0 right-0 text-center z-10"
        >
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 px-2">
            You'll get instant access to:
          </p>
          <div className="flex justify-center">
            <AnimatedTooltip items={processSteps} />
          </div>
        </motion.div>

        {/* Enhanced Floating Sparkles */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-16 sm:top-20 right-16 sm:right-20 text-blue-400/40 hidden lg:block"
        >
          <Sparkles size={24} />
        </motion.div>

        <motion.div
          animate={{
            y: [10, -10, 10],
            rotate: [360, 180, 0],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-16 sm:bottom-20 left-16 sm:left-20 text-purple-400/40 hidden lg:block"
        >
          <Sparkles size={20} />
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute top-1/2 right-8 sm:right-10 text-green-400/30 hidden lg:block"
        >
          <Sparkles size={16} />
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
