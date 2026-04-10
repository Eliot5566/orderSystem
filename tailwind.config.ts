import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          600: '#1e5aa7',
          700: '#154581'
        }
      }
    }
  },
  plugins: []
};

export default config;
