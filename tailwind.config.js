/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        accent: {
          DEFAULT: '#30b4ff',
          100: '#e1f5ff',
          200: '#b3e5fc',
          300: '#81d4fa',
          400: '#50c3f7',
          500: '#30b4ff',
          600: '#289bdb',
          700: '#1f7baf',
          800: '#175e87',
          900: '#0f3c5a',
        },
      },
      fontFamily: {
        body: ['"Rajdhani"', '"Segoe UI"', 'sans-serif'],
        heading: ['"Rajdhani"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        soft: '0 10px 28px rgba(0, 0, 0, 0.24)',
        glow: '0 0 0 1px rgba(48, 180, 255, 0.15), 0 0 32px rgba(48, 180, 255, 0.25)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(120,146,190,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,146,190,0.12) 1px, transparent 1px)',
      },
      keyframes: {
        flicker: {
          '0%, 19%, 21%, 23%, 80%, 100%': { opacity: '1' },
          '20%': { opacity: '0.88' },
          '22%': { opacity: '0.92' },
          '81%': { opacity: '0.94' },
        },
        scanline: {
          '0%': { transform: 'translateY(-120%)' },
          '100%': { transform: 'translateY(120%)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        statusPulse: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(255, 0, 0, 0)' },
          '50%': { boxShadow: '0 0 18px rgba(255, 0, 0, 0.35)' },
        },
        borderPulse: {
          '0%, 100%': { borderColor: 'rgba(185, 28, 28, 0.85)' },
          '50%': { borderColor: 'rgba(248, 113, 113, 0.95)' },
        },
        caretBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        slowFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        flicker: 'flicker 2.5s linear infinite',
        scanline: 'scanline 4.8s linear infinite',
        'reveal-up': 'revealUp 520ms ease-out both',
        'status-pulse': 'statusPulse 2.2s ease-in-out infinite',
        'border-pulse': 'borderPulse 2.8s ease-in-out infinite',
        'caret-blink': 'caretBlink 1s steps(1) infinite',
        'slow-float': 'slowFloat 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
