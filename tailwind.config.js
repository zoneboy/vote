/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'border-border'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dbf1e4',
          200: '#b9e3cb',
          300: '#8bcda8',
          400: '#5ab182',
          500: '#4C9341', // Main green color
          600: '#3d7a34',
          700: '#32612b',
          800: '#2b4e25',
          900: '#244020',
        },
        secondary: {
          50: '#f4faf3',
          100: '#e6f4e3',
          200: '#cfe9ca',
          300: '#a8d6a0',
          400: '#79be6e',
          500: '#5aa551',
          600: '#45863d',
          700: '#386a32',
          800: '#2f552b',
          900: '#284625',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
