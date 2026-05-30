/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#141826',
          elevated: '#1a1f33',
          overlay: 'rgba(20, 24, 38, 0.85)',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#dfc278',
          dim: '#8b7535',
        },
        ink: {
          primary: '#e8e4d9',
          secondary: '#a8a498',
          muted: '#7d7a72',
        },
        danger: { DEFAULT: '#f87171', muted: '#7f1d1d' },
        success: { DEFAULT: '#4ade80', muted: '#14532d' },
        warning: { DEFAULT: '#fb923c', muted: '#7c2d12' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}
