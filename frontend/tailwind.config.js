module.exports = {
  purge: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./public/index.html"
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#f3f4f6',
        success: '#10b981',
        danger: '#ef4444',
        primaryLight: '#60a5fa',
        textPrimary: '#374151',
        textSecondary: '#9ca3af',
        borderLight: '#e5e7eb',
        borderMedium: '#d1d5db',
        dangerLight: '#fef2f2'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        '50': '12.5rem',
        '15': '3.75rem',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}