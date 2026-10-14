export default {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        jungle: '#064E3B',
        jungleLight: '#0F766E',
        sunset: '#B45309',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
