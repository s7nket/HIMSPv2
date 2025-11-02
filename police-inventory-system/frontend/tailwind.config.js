/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust this to match your project structure
  ],
  theme: {
    extend: {
      // We are extending the default Tailwind palette with your custom colors
      colors: {
        'bg': '#ffffff',
        'bg-light': '#fafbfc',
        'text': '#1f2937',
        'text-secondary': '#6b7280',
        'text-tertiary': '#9ca3af',
        'primary': '#1d4ed8',
        'primary-dark': '#1e40af',
        'primary-light': '#3b82f6',
        'border': '#e5e7eb',
      },
      // Using your original font stack as the default 'sans' font
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Poppins', 'Roboto', 'sans-serif',
        ],
      },
      // Adding a custom animation for a fade-in-up effect
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};