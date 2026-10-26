/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#087CF7',
          'blue-hover': '#0066D6',
          'blue-light': '#EBF4FE',
          yellow: '#FFD329',
          'yellow-hover': '#ECC21C',
          'yellow-light': '#FFF9E5',
          green: '#20C86B',
          'green-hover': '#19AF5C',
          'green-light': '#E8F9F0',
          coral: '#FF6656',
          'coral-hover': '#E84E3E',
          'coral-light': '#FEEFEB',
          purple: '#9256F5',
          'purple-hover': '#7D3FE6',
          'purple-light': '#F4EFFF',
          ink: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
          surface: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'chunky': '0 4px 0 0 rgba(17, 24, 39, 0.1)',
        'chunky-active': '0 1px 0 0 rgba(17, 24, 39, 0.1)',
        'chunky-card': '0 6px 0 0 rgba(17, 24, 39, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
