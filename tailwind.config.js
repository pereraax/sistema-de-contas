/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Cores customizadas
    'bg-[#1a1a1a]',
    'bg-[#1A1A1A]',
    'bg-[#252525]',
    'bg-[#1f1f1f]',
    'bg-[#2a2a2a]',
    'bg-[#00C2FF]',
    'bg-[#0099CC]',
    'bg-[#007A99]',
    'bg-[#0D1B2A]',
    'bg-[#E6F7FF]',
    'bg-[#25D366]',
    'bg-[#20BA5A]',
    'bg-[#00B8E6]',
    'text-[#00C2FF]',
    'text-[#0D1B2A]',
    'border-[#00C2FF]',
    'border-[#2a2a2a]',
    'from-[#00C2FF]',
    'to-[#0099CC]',
    'hover:bg-[#0099CC]',
    'hover:bg-[#007A99]',
    'hover:bg-[#20BA5A]',
    'hover:bg-[#00B8E6]',
    // Classes de layout CRÍTICAS
    'flex',
    'flex-col',
    'flex-row',
    'items-center',
    'justify-between',
    'justify-center',
    'container',
    'mx-auto',
    'px-3',
    'px-4',
    'px-6',
    'py-2',
    'py-3',
    'gap-2',
    'gap-3',
    'sticky',
    'top-0',
    'z-50',
    // Animações
    'animate-float',
    'animate-float-1',
    'animate-float-2',
    'animate-float-3',
    'animate-fade-in',
    'animate-slide-up',
    'animate-notification-panel',
    'animate-notification-backdrop',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#1A1A1A',
          royal: '#252525',
          aqua: '#1e4976',
          white: '#FFFFFF',
          clean: '#E6E6E6',
        },
        primary: {
          DEFAULT: '#1e4976',
          50: '#E8EEF5',
          100: '#C5D4E8',
          200: '#9FB8DB',
          300: '#799CCE',
          400: '#5380C1',
          500: '#2c5aa0',
          600: '#1e4976',
          700: '#163a5f',
          800: '#0f2847',
          900: '#08192E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontWeight: {
        display: '300',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'notification-panel': 'notificationPanel 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'notification-backdrop': 'fadeIn 0.2s ease-out forwards',
        'gradient-move': 'gradientMove 15s ease-in-out infinite',
        'gradient-text': 'gradientText 4s ease-in-out infinite',
        'slide-left': 'slideLeft 90s linear infinite',
        'stats-float': 'statsFloat 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        notificationPanel: {
          '0%': { opacity: '0', transform: 'translateX(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        statsFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.02)' },
        },
        gradientMove: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10%, -10%) scale(1.1)' },
          '50%': { transform: 'translate(-5%, 5%) scale(0.95)' },
          '75%': { transform: 'translate(-10%, 10%) scale(1.05)' },
        },
        gradientText: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        'gradient-text': '200% 100%',
      },
    },
  },
  plugins: [],
}






