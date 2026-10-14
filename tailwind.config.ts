import type { Config } from 'tailwindcss';

/**
 * Design tokens de Patagonix Shop.
 * Paleta inspirada en la Patagonia: azules glaciares + acentos cálidos.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8ecdff',
          400: '#59b0ff',
          500: '#328ffb',
          600: '#1c6ff0',
          700: '#1559dc',
          800: '#1849b2',
          900: '#19408c',
          950: '#142855',
        },
        accent: {
          400: '#fbbf5c',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
