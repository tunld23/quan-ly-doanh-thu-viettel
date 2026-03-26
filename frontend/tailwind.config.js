/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ghi đè toàn bộ màu blue trong hệ thống cũ thành màu Viettel Red (#ee0033)
        blue: {
          50: '#fdf2f4',
          100: '#fbe5e9',
          200: '#f5c5ce',
          300: '#efa6b3',
          400: '#e4677f',
          500: '#ee0033', // Màu chủ đạo Viettel
          600: '#d6002e',
          700: '#b20026',
          800: '#8f001f',
          900: '#750019',
        }
      }
    },
  },
  plugins: [],
}
