/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        'primary-hover': '#059669',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(16, 185, 129, 0.1)',
        card: '0 0 20px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};
