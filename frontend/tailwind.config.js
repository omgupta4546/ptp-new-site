/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // RTU Official Palette
        'rtu-navy':    '#003087',
        'rtu-blue':    '#0047AB',
        'rtu-gold':    '#FFB800',
        'rtu-gold-dk': '#E6A500',
        'rtu-light':   '#F5F7FA',
        'rtu-dark':    '#0A1628',
        'rtu-slate':   '#1E3A5F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'rtu-gradient': 'linear-gradient(135deg, #003087 0%, #0047AB 50%, #0063CF 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFB800 0%, #E6A500 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,247,250,0.98) 100%)',
      },
      boxShadow: {
        'rtu':     '0 4px 24px rgba(0,48,135,0.15)',
        'rtu-lg':  '0 8px 48px rgba(0,48,135,0.20)',
        'gold':    '0 4px 24px rgba(255,184,0,0.30)',
        'card':    '0 2px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(0,48,135,0.15)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'bounce-in':  'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        bounceIn: {
          from: { opacity: 0, transform: 'scale(0.8)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
