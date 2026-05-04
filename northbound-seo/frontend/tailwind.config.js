/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        surface2: '#1e1e1e',
        border: '#2a2a2a',
        text: '#e0e0e0',
        dim: '#888888',
        accent: '#4f9cf7',
        accent2: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        purple: '#a855f7',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
