import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sterion: ['Sterion', 'serif'],
      },
      colors: {
        // Define colors based on PLAN.md and quisine.app
        // PLAN.md: Dark mode default, Neutral grays, Soft green (positive), Soft red (negative)
        // quisine.app: pink, black, white, light-gray, heading-color, text-color, text-color-secondary

        // MarketLens specific colors
        'market-primary': '#1D1D1F', // Dark heading color from quisine.app (but will be for dark background text)
        'market-secondary': '#514e65', // Text color from quisine.app
        'market-accent-positive': '#28a745', // Example soft green
        'market-accent-negative': '#dc3545', // Example soft red
        'market-background-dark': '#0a0a0a', // From Next.js dark mode root
        'market-background-light': '#ffffff', // From Next.js light mode root
        'market-neutral-gray': '#858393', // Secondary text color from quisine.app
      },
      typography: {
        DEFAULT: {
          css: {
            p: {
              textIndent: '1.5em', // Apply first-line indent to paragraphs
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;