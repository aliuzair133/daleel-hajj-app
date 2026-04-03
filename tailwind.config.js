/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 'class' strategy: dark mode toggled by adding `.dark` to <html>
  // Falls back gracefully to `prefers-color-scheme` via CSS in index.css
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#0D7377',
          light:   '#14A8AE',
          dark:    '#095C5F',
          50:      '#E8F4F4',
          100:     '#C5E4E5',
          900:     '#072D2F',
        },
        gold: {
          primary: '#C9A84C',
          light:   '#E0C068',
          dark:    '#A8873A',
        },
        sage: {
          primary: '#2D6A4F',
          light:   '#40916C',
          dark:    '#1B4332',
        },
      },
      fontFamily: {
        sans:   ['Noto Sans', 'system-ui', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'Arial Arabic', 'serif'],
      },
      boxShadow: {
        card:       '0 2px 12px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.12)',
        elevated:   '0 4px 24px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      animation: {
        'page-enter': 'pageEnter 220ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 180ms ease-out both',
        'slide-up':   'slideUp 250ms cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
      },
      keyframes: {
        pageEnter: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '70%':  { transform: 'scale(1.35)', opacity: '0' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    // scrollbar-hide utility (no extra npm package needed)
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
        },
      });
    },
  ],
}
