/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      zIndex: {
        '9999': '9999',
        '99999': '99999', // 🔍 Para overlays o modales extremos
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'fade-in-scale': 'fadeInScale 0.3s ease-out forwards',
        'fade-out-scale': 'fadeOutScale 0.3s ease-in forwards',
        'toast-slide': 'slideInRight 0.4s ease-out both',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeOutScale: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
};
