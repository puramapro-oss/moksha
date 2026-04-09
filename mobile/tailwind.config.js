/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        moksha: {
          bg: '#070B18',
          card: '#0D1225',
          primary: '#FF6B35',
          secondary: '#FFD700',
          accent: '#5DCAA5',
          surface: '#141A2E',
          border: 'rgba(255,255,255,0.06)',
        },
      },
      fontFamily: {
        syne: ['Syne_800ExtraBold'],
        dm: ['DMSans_400Regular'],
        'dm-medium': ['DMSans_500Medium'],
        'dm-bold': ['DMSans_700Bold'],
      },
    },
  },
  plugins: [],
}
