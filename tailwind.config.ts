import type { Config } from 'tailwindcss';

/**
 * Farbwelt: Sinai bei Sonnenaufgang.
 * sand   = Wuestenboden (Hintergrund)
 * tafel  = Steintafel (Karten, Tabellen)
 * flamme = brennender Dornbusch (Aktion, Alarm)
 * meer   = geteiltes Rotes Meer (Primaeraktion, Links)
 * kalb   = goldenes Kalb (Akzente)
 * manna  = Wuestenbrot (gruen: anwesend)
 * bernstein = entschuldigte Absenz (gelb, klar getrennt vom Rot)
 * rot    = unentschuldigte Absenz
 */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fdfaf4', 100: '#f8f1e3', 200: '#efe2c9', 300: '#e2cda6',
          400: '#d2b47f', 500: '#c19c5e', 600: '#a67f47', 700: '#84633a',
          800: '#5c4529', 900: '#2f2315', 950: '#1a1209',
        },
        tafel: {
          50: '#f6f6f5', 100: '#e8e8e5', 200: '#d2d2cc', 300: '#b0b0a7',
          400: '#8a8a7e', 500: '#6d6d62', 600: '#56564d', 700: '#454540',
          800: '#2c2c28', 900: '#1c1c19', 950: '#111110',
        },
        flamme: {
          50: '#fff5ed', 100: '#ffe8d4', 200: '#ffcda8', 300: '#ffa970',
          400: '#ff7a36', 500: '#fb570f', 600: '#ec3d06', 700: '#c42c07',
          800: '#9c250e', 900: '#7e220f', 950: '#440d04',
        },
        meer: {
          50: '#eefbfd', 100: '#d4f4f9', 200: '#aee8f3', 300: '#75d6ea',
          400: '#35bad9', 500: '#199dbf', 600: '#177da1', 700: '#1a6583',
          800: '#1f536b', 900: '#1e455b', 950: '#0e2c3e',
        },
        kalb: {
          50: '#fefbe8', 100: '#fff8c2', 200: '#ffee89', 300: '#ffdd45',
          400: '#fdc712', 500: '#eda905', 600: '#cc8102', 700: '#a35a06',
          800: '#86470d', 900: '#723b11', 950: '#431e05',
        },
        bernstein: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
        rot: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
        },
        manna: {
          50: '#f1fcf3', 100: '#defae5', 200: '#bff3cd', 300: '#8de8a8',
          400: '#54d47b', 500: '#2dba58', 600: '#1f9945', 700: '#1c7839',
          800: '#1b5f31', 900: '#184e2b', 950: '#072b15',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['ui-serif', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        tafel: '0 1px 2px rgba(28,28,25,.06), 0 8px 24px -12px rgba(28,28,25,.25)',
        dornbusch: '0 0 0 1px rgba(251,87,15,.35), 0 12px 40px -12px rgba(251,87,15,.45)',
      },
      keyframes: {
        flackern: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.82', transform: 'scale(1.06)' },
        },
        aufstieg: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        teilung: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        flackern: 'flackern 2.6s ease-in-out infinite',
        aufstieg: 'aufstieg .28s ease-out both',
        teilung: 'teilung .5s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
