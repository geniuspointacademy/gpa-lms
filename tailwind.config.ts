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
        gpa: {
          green: '#0B6E4F',
          navy: '#1A2B4A',
          gold: '#D4A017',
        },
      },
    },
  },
  plugins: [],
}

export default config
