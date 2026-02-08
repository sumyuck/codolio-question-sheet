import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        codolio: {
          bg: '#0f1115',
          panel: '#181b21',
          panelLight: '#1f232b',
          border: '#2a2f37',
          muted: '#9aa1aa',
          accent: '#f97316',
          accentSoft: '#fb923c',
          success: '#22c55e'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
