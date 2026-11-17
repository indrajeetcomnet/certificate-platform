/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F7FF',
          100: '#EBF0FE',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        // Premium white / ivory / alabaster shades
        pearl: {
          50: '#FCFCF9',
          100: '#F9F9F5',
          200: '#F3F3ED',
          300: '#E8E8DF',
        },
        alabaster: '#F8F8F5',
        ivory: '#FAF9F5',
        warmWhite: '#FBFBFA',
        obsidian: {
          800: '#1E232D',
          900: '#0F1319',
          950: '#080A0D',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FDE68A',
          dark: '#B45309',
        },
        silver: '#9CA3AF',
        bronze: '#B45309',
        emeraldAccent: {
          500: '#10B981',
          600: '#059669',
        },
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03)',
        'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
