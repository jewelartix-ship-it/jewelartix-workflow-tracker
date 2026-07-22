/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        surface: '#FFFFFF',
        'surface-alt': '#F2ECE1',
        'surface-hover': '#EDE5D6',
        border: {
          DEFAULT: '#E6DECD',
          strong: '#D8CDB6',
        },
        ink: {
          DEFAULT: '#2B2420',
          muted: '#8A7F6E',
          faint: '#B3A996',
        },
        accent: {
          DEFAULT: '#8B5E3C',
          hover: '#744D30',
          soft: '#EFE1D1',
        },
        success: {
          DEFAULT: '#6B8A5A',
          soft: '#E7EEE0',
        },
        warning: {
          DEFAULT: '#C08A3E',
          soft: '#F5E9D6',
        },
        danger: {
          DEFAULT: '#B3543E',
          soft: '#F3E1DB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43, 36, 32, 0.04), 0 4px 10px rgba(43, 36, 32, 0.04)',
        popover: '0 8px 24px rgba(43, 36, 32, 0.12), 0 2px 6px rgba(43, 36, 32, 0.06)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
