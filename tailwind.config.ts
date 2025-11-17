import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        frauddetect: {
          "primary": "#0ea5e9",
          "primary-focus": "#0284c7",
          "primary-content": "#ffffff",
          "secondary": "#06b6d4",
          "secondary-focus": "#0891b2",
          "secondary-content": "#ffffff",
          "accent": "#8b5cf6",
          "accent-focus": "#7c3aed",
          "accent-content": "#ffffff",
          "neutral": "#1e293b",
          "neutral-focus": "#0f172a",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
    darkTheme: false,
  },
};

export default config;

