/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fleet: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
          // Dark theme
          bg:      '#0a0e1a',
          sidebar: '#0d1117',
          card:    '#111827',
          card2:   '#131d2e',
          border:  '#1e293b',
          accent:  '#7c3aed',
        },
      },
      backgroundImage: {
        'card-blue':   'linear-gradient(135deg, rgba(30,58,138,0.5) 0%, rgba(15,23,42,0.8) 100%)',
        'card-red':    'linear-gradient(135deg, rgba(127,29,29,0.5) 0%, rgba(15,23,42,0.8) 100%)',
        'card-amber':  'linear-gradient(135deg, rgba(120,53,15,0.5) 0%, rgba(15,23,42,0.8) 100%)',
        'card-teal':   'linear-gradient(135deg, rgba(19,78,74,0.5) 0%, rgba(15,23,42,0.8) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow-violet': '0 0 20px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
};
