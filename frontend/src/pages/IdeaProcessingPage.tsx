import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Brain,
  Target,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Rocket,
  Code,
  BarChart3,
} from 'lucide-react';

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  completed: boolean;
}

const IdeaProcessingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const idea = location.state?.idea || '';

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const processingSteps: ProcessingStep[] = [
    {
      id: 'analyzing',
      title: 'Analyzing Your Idea',
      description:
        'Our AI is breaking down your concept and identifying key components',
      icon: <Brain className="text-blue-400" size={24} />,
      duration: 2000,
      completed: false,
    },
    {
      id: 'market',
      title: 'Market Research',
      description: 'Researching market size, competitors, and opportunities',
      icon: <BarChart3 className="text-purple-400" size={24} />,
      duration: 3000,
      completed: false,
    },
    {
      id: 'validation',
      title: 'Idea Validation',
      description: 'Validating market demand and assessing viability',
      icon: <Target className="text-green-400" size={24} />,
      duration: 2500,
      completed: false,
    },
    {
      id: 'features',
      title: 'Feature Planning',
      description: 'Generating MVP features and development roadmap',
      icon: <Rocket className="text-orange-400" size={24} />,
      duration: 2000,
      completed: false,
    },
    {
      id: 'techstack',
      title: 'Tech Stack Selection',
      description: 'Recommending optimal technologies and architecture',
      icon: <Code className="text-cyan-400" size={24} />,
      duration: 1500,
      completed: false,
    },
  ];

  const [steps, setSteps] = useState(processingSteps);

  useEffect(() => {
    if (!idea) {
      navigate('/');
      return;
    }

    let stepIndex = 0;
    const processSteps = () => {
      if (stepIndex < steps.length) {
        const timer = setTimeout(() => {
          setSteps(prev =>
            prev.map((step, index) =>
              index === stepIndex ? { ...step, completed: true } : step
            )
          );
          setCurrentStep(stepIndex + 1);
          stepIndex++;
          processSteps();
        }, steps[stepIndex].duration);

        return () => clearTimeout(timer);
      } else {
        setTimeout(() => {
          setIsProcessing(false);
          setShowResults(true);
        }, 1000);
      }
    };

    processSteps();
  }, [idea, navigate, steps]);

  // Mock results data - in real app, this would come from API
  const mockResults = {
    businessAnalysis: {
      businessModelType: 'B2B SaaS',
      revenueModel: 'Subscription',
      viabilityScore: 85,
      scalabilityScore: 90,
      confidenceScore: 88,
    },
    marketValidation: {
      marketSize: {
        tam: '$50 billion globally',
        sam: '$5 billion in target markets',
        som: '$50 million achievable in 5 years',
      },
      validationScore: 82,
      targetAudience: 'Small to medium businesses seeking automation solutions',
    },
    features: {
      mvpFeatures: [
        'User Dashboard & Analytics',
        'Core Automation Engine',
        'Basic Reporting System',
        'User Authentication',
      ],
      growthFeatures: [
        'Advanced Analytics & Insights',
        'Team Collaboration Tools',
        'API Integration Platform',
        'Custom Workflow Builder',
      ],
    },
    techStack: {
      frontend: {
        primary: 'React + TypeScript',
        reasoning: 'Large ecosystem, type safety, and community support',
      },
      backend: {
        primary: 'Node.js + Express',
        reasoning: 'JavaScript consistency across stack and rapid development',
      },
      database: {
        primary: 'PostgreSQL',
        reasoning: 'ACID compliance, advanced features, and scalability',
      },
      estimatedCosts: {
        development: '$75,000 - $125,000 for MVP',
        monthly: '$800 - $1,500 monthly operational costs',
      },
    },
  };

  if (!idea) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="p-6 lg:p-8">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>
        </div>

        <div className="px-6 lg:px-8 pb-20">
          <div className="max-w-5xl mx-auto">
            {/* Idea Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Analyzing Your SaaS Idea
              </h1>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto">
                <p className="text-gray-300 text-lg md:text-xl italic leading-relaxed">
                  "{idea}"
                </p>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-6 p-6 lg:p-8 rounded-2xl border transition-all duration-500 backdrop-blur-sm shadow-xl ${
                        step.completed
                          ? 'bg-green-500/10 border-green-500/30 shadow-green-500/10'
                          : currentStep === index
                            ? 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/10'
                            : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="relative">
                        {step.completed ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg"
                          >
                            <CheckCircle className="text-white" size={28} />
                          </motion.div>
                        ) : currentStep === index ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"
                          >
                            {step.icon}
                          </motion.div>
                        ) : (
                          <div className="w-14 h-14 bg-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600/50">
                            {step.icon}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-400">{step.description}</p>
                      </div>

                      {currentStep === index && !step.completed && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-blue-400"
                        >
                          <Sparkles size={24} />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {showResults && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-12"
                >
                  {/* Success Header */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-center mb-16"
                  >
                    <div className="w-24 h-24 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <CheckCircle className="text-white" size={48} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                      Your Blueprint is Ready! 🎉
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                      Here's your comprehensive SaaS analysis and actionable
                      recommendations
                    </p>
                  </motion.div>

                  {/* Results Grid */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Business Analysis */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Brain className="text-blue-400" size={24} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          Business Analysis
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Business Model:</span>
                          <span className="text-white font-medium">
                            {mockResults.businessAnalysis.businessModelType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Revenue Model:</span>
                          <span className="text-white font-medium">
                            {mockResults.businessAnalysis.revenueModel}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">
                            Viability Score:
                          </span>
                          <span className="text-green-400 font-semibold text-lg">
                            {mockResults.businessAnalysis.viabilityScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">
                            Scalability Score:
                          </span>
                          <span className="text-blue-400 font-semibold text-lg">
                            {mockResults.businessAnalysis.scalabilityScore}/100
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Market Validation */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <Target className="text-green-400" size={24} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          Market Validation
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Total Addressable Market
                          </span>
                          <p className="text-white font-semibold text-lg">
                            {mockResults.marketValidation.marketSize.tam}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Target Audience
                          </span>
                          <p className="text-white font-medium">
                            {mockResults.marketValidation.targetAudience}
                          </p>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">
                            Validation Score:
                          </span>
                          <span className="text-green-400 font-semibold text-lg">
                            {mockResults.marketValidation.validationScore}/100
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                          <Rocket className="text-orange-400" size={24} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          Feature Roadmap
                        </h3>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-3">
                            MVP Features
                          </h4>
                          <ul className="space-y-2">
                            {mockResults.features.mvpFeatures.map(
                              (feature, index) => (
                                <li
                                  key={index}
                                  className="text-gray-300 flex items-center gap-3"
                                >
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  {feature}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-purple-400 font-semibold mb-3">
                            Growth Features
                          </h4>
                          <ul className="space-y-2">
                            {mockResults.features.growthFeatures.map(
                              (feature, index) => (
                                <li
                                  key={index}
                                  className="text-gray-300 flex items-center gap-3"
                                >
                                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                  {feature}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tech Stack */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <Code className="text-cyan-400" size={24} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          Tech Stack
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Frontend:</span>
                          <span className="text-white font-medium">
                            {mockResults.techStack.frontend.primary}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Backend:</span>
                          <span className="text-white font-medium">
                            {mockResults.techStack.backend.primary}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Database:</span>
                          <span className="text-white font-medium">
                            {mockResults.techStack.database.primary}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-slate-700/50">
                          <div className="text-gray-400 text-sm mb-2">
                            Development Cost
                          </div>
                          <div className="text-green-400 font-semibold text-lg">
                            {mockResults.techStack.estimatedCosts.development}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* CTA Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center pt-12"
                  >
                    <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-12 backdrop-blur-sm shadow-2xl">
                      <div className="space-y-6">
                        <h3 className="text-3xl md:text-4xl font-bold text-white">
                          Ready to Build Your SaaS?
                        </h3>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                          Get the complete blueprint with detailed
                          implementation guides, code templates, and
                          step-by-step instructions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                          >
                            Download Full Blueprint
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            className="px-8 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded-xl transition-colors border border-slate-600/50 backdrop-blur-sm"
                          >
                            Analyze Another Idea
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaProcessingPage;
