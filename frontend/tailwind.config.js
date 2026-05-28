/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', light: '#3b82f6' },
        danger: { DEFAULT: '#dc2626', bg: '#fef2f2' },
        success: { DEFAULT: '#16a34a', bg: '#f0fdf4' },
        warning: { DEFAULT: '#ea580c', bg: '#fff7ed' },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"',
          '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
