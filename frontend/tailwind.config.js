/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: "var(--fintech-bg)",
          surface: "var(--fintech-surface)",
          card: "var(--fintech-card)",
          'card-hover': "var(--fintech-card-hover)",
          subtle: "var(--fintech-subtle)",
          border: "var(--fintech-border)",
          'border-light': "var(--fintech-border-light)",
          text: "var(--fintech-text)",
          muted: "var(--fintech-muted)",
          emerald: "#10B981",
          teal: "#14B8A6",
          cyan: "#06B6D4",
          indigo: "#6366F1",
          purple: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.3)',
        'glow-indigo': '0 0 25px -4px rgba(99, 102, 241, 0.3)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.3)',
        'glow-rose': '0 0 25px -4px rgba(244, 63, 94, 0.3)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.3)',
        'glow-card': 'var(--fintech-card-shadow)',
        'fintech-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
