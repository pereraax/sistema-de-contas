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
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#0D1B2A',
          royal: '#1B263B',
          aqua: '#00C2FF',
          white: '#FFFFFF',
          clean: '#E6E6E6',
        },
        primary: {
          DEFAULT: '#00C2FF',
          50: '#E6F7FF',
          100: '#B3E5FF',
          200: '#80D3FF',
          300: '#4DC1FF',
          400: '#1AAFFF',
          500: '#00C2FF',
          600: '#0099CC',
          700: '#007099',
          800: '#004D66',
          900: '#002A33',
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
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}





