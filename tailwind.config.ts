import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Neo-brutalist palette
        brand: {
          50:  '#fff6e9',
          100: '#ffe5cc',
          200: '#ffc799',
          300: '#ff9a66',
          400: '#ff6a45',
          500: '#f43f27',
          600: '#d82315',
          700: '#aa170f',
          800: '#74100f',
          900: '#3d0908',
        },
        cream: '#fff6e9',
        ink: '#111111',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
