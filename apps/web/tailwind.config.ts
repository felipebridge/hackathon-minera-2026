import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/componentes/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fondo: {
          DEFAULT: '#0A0B0E',
          secundario: '#0F1117',
          tarjeta: '#131620',
          elevado: '#1A1F2E',
          borde: '#1E2435',
        },
        mineral: {
          50: '#F0F4FF',
          100: '#E0E9FF',
          200: '#C1D3FF',
          300: '#93ABFF',
          400: '#6080FF',
          500: '#3D5AFE',
          600: '#2545F5',
          700: '#1A36E0',
          800: '#1A2DB5',
          900: '#1C2A8E',
          950: '#131A5C',
        },
        cobre: {
          400: '#FF8C42',
          500: '#FF6B2C',
          600: '#E05520',
        },
        exito: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        advertencia: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
        peligro: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        texto: {
          primario: '#F1F5F9',
          secundario: '#94A3B8',
          terciario: '#64748B',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradiente-mineral': 'linear-gradient(135deg, #3D5AFE 0%, #1A36E0 100%)',
        'gradiente-oscuro': 'linear-gradient(180deg, #0F1117 0%, #0A0B0E 100%)',
        'gradiente-tarjeta': 'linear-gradient(135deg, #131620 0%, #1A1F2E 100%)',
        'gradiente-hero':
          'radial-gradient(ellipse at top, #1A2DB5 0%, #0F1117 60%), linear-gradient(180deg, #0F1117 0%, #0A0B0E 100%)',
        'malla-industrial':
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233D5AFE' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow-mineral': '0 0 30px rgba(61, 90, 254, 0.3)',
        'glow-sm': '0 0 15px rgba(61, 90, 254, 0.15)',
        'tarjeta': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'tarjeta-hover': '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(61, 90, 254, 0.3)',
        'modal': '0 25px 80px rgba(0, 0, 0, 0.8)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      animation: {
        'pulso-suave': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'deslizar-arriba': 'slideUp 0.3s ease-out',
        'aparecer': 'fadeIn 0.2s ease-out',
        'brillar': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
