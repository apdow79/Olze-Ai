import type { Config } from 'tailwindcss';
/** Olze design tokens — see design/DESIGN_TOKENS.md */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',
          500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',
        },
        accent: '#22d3ee',
        surface: { light:'#ffffff', dark:'#0b0f1a', raised:'#111827' },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
        mono: ['JetBrains Mono','ui-monospace','monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
