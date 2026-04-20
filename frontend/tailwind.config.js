/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 国风配色
        ink: {
          DEFAULT: '#1A1A1A',      // 墨黑
          light: '#2D2D2D',         // 淡墨
        },
        vermilion: {
          DEFAULT: '#C41E3A',      // 朱砂红
          dark: '#8B0000',          // 暗红
          light: '#FFE4E1',         // 淡红
        },
        gold: {
          DEFAULT: '#B8860B',       // 暗金
          light: '#D4AF37',         // 金色
          pale: '#F5F5DC',         // 淡金
        },
        paper: {
          DEFAULT: '#F5F0E6',      // 宣纸色
          cream: '#FFF8DC',        // 米白
          dark: '#E8E0D0',         // 旧纸色
        },
        tea: {
          DEFAULT: '#5D4E37',       // 茶色
          light: '#8B7355',        // 淡茶
        },
        bamboo: {
          DEFAULT: '#2E8B57',       // 竹青
          dark: '#1A5E3A',         // 深竹
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'SimSun', 'serif'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '4px',
        '2xl': '8px',
      },
      boxShadow: {
        'classic': '0 2px 8px rgba(26, 26, 26, 0.15)',
        'classic-lg': '0 4px 16px rgba(26, 26, 26, 0.2)',
      },
    },
  },
  plugins: [],
}
