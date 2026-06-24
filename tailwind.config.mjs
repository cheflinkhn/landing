/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}', './public/**/*.js'],
  theme: {
    extend: {
      colors: {
        // Brand orange — anchored on the logo (#F97216 ≈ orange-500).
        // See DESIGN-TOKENS.md: 500 = brand mark / focus / large graphics only;
        // 700 = accent (white-label buttons, links); 800 = hover/pressed.
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97216',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
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
