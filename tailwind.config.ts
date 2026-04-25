import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oro Moderno
        'bg-base': '#0F0F0F',
        'bg-surface': '#161616',
        'bg-overlay': '#1F1F1F',
        'border': '#2A2A2A',
        'fg': '#F5F5F5',
        'fg-muted': '#A0A0A0',
        'fg-subtle': '#6E6E6E',
        'gold': '#FFD700',
        'gold-hover': '#FFC700',
        'gold-soft': '#D4AF37',
        'success': '#10B981',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'gold': '0 0 30px rgba(255, 215, 0, 0.15)',
        'gold-strong': '0 0 50px rgba(255, 215, 0, 0.3)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
