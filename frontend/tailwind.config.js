const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        background: '#f8faff',
        foreground: '#1a1a1a',
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontSize: {
        'sm': 'var(--font-size-small)',
        'base': 'var(--font-size-medium)',
        'lg': 'var(--font-size-large)',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'h1': '2rem',
        'h2': '1.5rem',
        'h3': '1.25rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
      opacity: {
        '60': '0.6',
        '80': '0.8',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
      boxShadow: {
        'window': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
      },
      borderColor: {
        DEFAULT: 'rgba(0, 0, 0, 0.05)',
        'dark': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
