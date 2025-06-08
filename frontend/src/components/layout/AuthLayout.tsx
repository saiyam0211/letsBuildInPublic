import React from 'react';
import { FlipWords } from '../ui/FlipWords';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const words = ['Speed.', 'Clarity.', 'Scale.', 'Impact.'];

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Modern geometric background */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Elegant gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-neon-purple/15 to-neon-pink/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-br from-white/5 to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Tech Illustration & Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative">
          {/* Background gradient for illustration area */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm" />

          <div className="relative z-10 max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-12"></div>

            {/* Hero content */}
            <div className="space-y-8 mb-12">
              <div>
                <h2 className="text-4xl xl:text-5xl font-bold text-dark-text-primary leading-tight mb-6">
                  Bring Your SaaS Vision to Life with
                  <span className="bg-gradient-neon bg-clip-text text-transparent">
                    <FlipWords
                      words={words}
                      className="bg-gradient-neon bg-clip-text text-transparent"
                    />
                  </span>
                </h2>
                <p className="text-lg text-dark-text-secondary leading-relaxed">
                  Your one-stop solution for turning SaaS ideas into structured,
                  launch-ready blueprints — in minutes.
                </p>
              </div>
            </div>

            {/* Tech Illustration - AI Blueprint Generation */}
            <div className="relative">
              {/* Main illustration container */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-2xl">
                {/* AI Brain/Processor Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center shadow-glow animate-pulse">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    {/* Animated rings around AI icon */}
                    <div className="absolute inset-0 border-2 border-neon-blue/30 rounded-lg animate-ping" />
                    <div className="absolute inset-0 border border-neon-purple/40 rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Arrow pointing down */}
                <div className="flex justify-center mb-4">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-neon-blue to-transparent animate-pulse" />
                </div>

                {/* Generated Blueprints Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Flowchart */}
                  <div className="bg-slate-700/50 rounded-lg p-3 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                      <span className="text-xs text-slate-300 font-medium">
                        Flowchart
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-600 rounded" />
                      <div className="h-1 bg-slate-600 rounded w-3/4" />
                      <div className="h-1 bg-slate-600 rounded w-1/2" />
                    </div>
                  </div>

                  {/* Wireframe */}
                  <div className="bg-slate-700/50 rounded-lg p-3 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        Wireframe
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-600 rounded" />
                      <div className="h-1 bg-slate-600 rounded w-2/3" />
                      <div className="h-1 bg-slate-600 rounded w-4/5" />
                    </div>
                  </div>

                  {/* Database Schema */}
                  <div className="bg-slate-700/50 rounded-lg p-3 border border-neon-pink/20 hover:border-neon-pink/40 transition-all duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"
                        style={{ animationDelay: '1s' }}
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        Market Validation
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-600 rounded w-5/6" />
                      <div className="h-1 bg-slate-600 rounded" />
                      <div className="h-1 bg-slate-600 rounded w-3/5" />
                    </div>
                  </div>

                  {/* API Routes */}
                  <div className="bg-slate-700/50 rounded-lg p-3 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                        style={{ animationDelay: '1.5s' }}
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        Tech Stack
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-600 rounded w-4/5" />
                      <div className="h-1 bg-slate-600 rounded w-2/3" />
                      <div className="h-1 bg-slate-600 rounded" />
                    </div>
                  </div>
                </div>

                {/* Generation status */}
                <div className="mt-6 flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-neon-blue rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-neon-blue rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">
                    Generating blueprints...
                  </span>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-blue/20 rounded-full blur-sm animate-float" />
              <div
                className="absolute -bottom-6 -left-2 w-6 h-6 bg-neon-purple/20 rounded-full blur-sm animate-float"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
          {/* Subtle background for form area */}
          <div className="absolute inset-0 bg-gradient-to-bl from-slate-900/30 to-transparent" />

          <div className="w-full max-w-md relative z-10">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-neon rounded-2xl mb-4 shadow-glow">
                <span className="text-xl font-bold text-white">SB</span>
              </div>
              <h1 className="text-2xl font-bold text-dark-text-primary">
                SaaS Blueprint
              </h1>
              <p className="text-dark-text-secondary">
                Transform ideas into implementation plans
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
