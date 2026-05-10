/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        ink: '#07142f',
        ocean: {
          50: '#f5f8ff',
          100: '#eaf0ff',
          200: '#d8e4ff',
          300: '#aec5ff',
          400: '#7fa0f4',
          500: '#527be8',
          600: '#315bd2',
          700: '#2246ad',
          800: '#1d3c91',
          900: '#183371',
        },
      },
      boxShadow: {
        soft: '0 22px 70px rgba(31, 63, 125, 0.12)',
        lift: '0 16px 36px rgba(24, 51, 113, 0.16)',
      },
      borderRadius: {
        panel: '18px',
      },
      keyframes: {
        rise: {
          '0%': { opacity: 0, transform: 'translateY(28px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { opacity: 0.72, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.04)' },
        },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(.2,.8,.2,1) both',
        softPulse: 'softPulse 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
