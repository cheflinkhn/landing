/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}', './public/**/*.js'],
  theme: {
    extend: {
      colors: {
        // Warm terracotta accent — the brand voice
        clay: {
          50: '#FBF3EE',
          100: '#F6E2D5',
          200: '#EDC3AB',
          300: '#E29F7B',
          400: '#D77A4F',
          500: '#C75A2E',
          600: '#AC481F',
          700: '#8C3A1B',
          800: '#6E2F19',
          900: '#4C2113',
        },
        // Warm neutral ramp (replaces cold slate)
        sand: {
          50: '#FBF8F4',
          100: '#F4EEE6',
          200: '#E7DDD0',
          300: '#D4C5B2',
          400: '#A99685',
          500: '#7C6B5C',
          600: '#5C4E42',
          700: '#43392F',
          800: '#2C261F',
          900: '#1C1714',
        },
        cream: '#FBF8F4',
        ink: '#1C1714',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(28,23,20,0.05), 0 10px 30px -14px rgba(28,23,20,0.18)',
        lift: '0 2px 6px rgba(28,23,20,0.05), 0 24px 50px -20px rgba(28,23,20,0.28)',
      },
    },
  },
  plugins: [],
};
