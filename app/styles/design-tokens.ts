// デザインシステム定義
// 2.1 デザインガイドに準拠

export const COLORS = {
  // 背景
  bg: '#FFFFFF',
  
  // テキスト
  textStrong: '#0F0F0F',  // 主要テキスト（見出し等）
  text: '#212121',         // 通常テキスト
  muted: '#606060',        // 補助テキスト
  
  // 境界線
  line: '#E5E5E5',
  
  // アクセント（YouTube Red - プライマリアクション、強調用に限定）
  accent: '#FF0000',
  accentPress: '#CC0000',
  
  // フォーカス
  focus: '#1A73E8',
} as const;

// タイポグラフィスケール（px）
export const FONT_SIZES = {
  xs: 12,   // 補助的な情報
  sm: 14,   // 通常のテキスト
  md: 16,   // 標準
  lg: 20,   // 小見出し
  xl: 28,   // 大見出し
} as const;

// スペーシング（8の倍数）
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// コンポーネント固有のトークン
export const COMPONENT = {
  // カードとテーブルの外枠パディング
  cardPadding: 24,
  
  // 角丸（小さめ）
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  
  // 影（浅め）
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
} as const;

// フォントファミリー（日本語システムUIフォント優先）
export const FONT_FAMILY = {
  base: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif',
  mono: 'Consolas, Monaco, "Courier New", monospace',
} as const;

// ブレークポイント
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;