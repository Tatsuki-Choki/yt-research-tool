import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // デザインガイド準拠のカラートークン
        'yt': {
          'bg': '#FFFFFF',
          'text-strong': '#0F0F0F',
          'text': '#212121',
          'muted': '#606060',
          'line': '#E5E5E5',
          'accent': '#FF0000',
          'accent-press': '#CC0000',
          'focus': '#1A73E8',
        }
      },
      fontSize: {
        // デザインガイド準拠のタイポグラフィスケール
        'yt-xs': '12px',
        'yt-sm': '14px',
        'yt-md': '16px',
        'yt-lg': '20px',
        'yt-xl': '28px',
      },
      spacing: {
        // 8の倍数グリッド
        'yt-xs': '4px',
        'yt-sm': '8px',
        'yt-md': '16px',
        'yt-lg': '24px',
        'yt-xl': '32px',
        'yt-xxl': '40px',
        'yt-xxxl': '48px',
      },
      borderRadius: {
        // 小さめの角丸
        'yt-sm': '4px',
        'yt-md': '6px',
        'yt-lg': '8px',
      },
      boxShadow: {
        // 浅めの影
        'yt-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'yt-md': '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'yt-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        // 日本語システムUIフォント優先
        'yt-sans': ['-apple-system', 'BlinkMacSystemFont', '"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"', '"Noto Sans JP"', 'Meiryo', 'sans-serif'],
        'yt-mono': ['Consolas', 'Monaco', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;