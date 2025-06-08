/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        dark: {
          primary: '#0c0c1d',
          secondary: '#000000',
          accent: '#1a1a2e',
          border: '#16213e',
          text: {
            primary: '#ffffff',
            secondary: '#a0aec0',
            muted: '#718096',
          },
          input: {
            bg: 'rgba(255, 255, 255, 0.05)',
            border: 'rgba(255, 255, 255, 0.1)',
            focus: 'rgba(255, 255, 255, 0.2)',
          },
        },
        // Futuristic accent colors
        neon: {
          blue: '#00d4ff',
          purple: '#8b5cf6',
          pink: '#f472b6',
          green: '#10b981',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0c0c1d 0%, #000000 100%)',
        'gradient-accent': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          'to': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      },
      blur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 