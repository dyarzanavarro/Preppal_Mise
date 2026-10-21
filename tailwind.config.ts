import type { Config } from 'tailwindcss'

// Colors come from CSS variables in assets/css/main.css (light + dark), as RGB channels for opacity modifiers.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

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
        bg:      v('bg'),
        surface: v('surface'),
        ink:     { DEFAULT: v('ink'), 2: v('ink-2') },
        accent:  v('accent'),
        ok:      v('ok'),
        warn:    v('warn'),
        danger:  v('danger'),
        line:    'var(--line)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
