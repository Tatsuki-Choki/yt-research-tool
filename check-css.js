const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // ページにアクセス
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // CSSが適用されているか確認
  const styles = await page.evaluate(() => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    
    // Tailwind CSSが適用されているか確認
    const hasTailwind = document.querySelector('[class*="bg-"]') || 
                        document.querySelector('[class*="text-"]') ||
                        document.querySelector('[class*="flex"]') ||
                        document.querySelector('[class*="grid"]');
    
    // カスタムCSSが適用されているか確認
    const rootStyles = window.getComputedStyle(document.documentElement);
    const customVars = {
      '--bg': rootStyles.getPropertyValue('--bg'),
      '--text': rootStyles.getPropertyValue('--text'),
      '--accent': rootStyles.getPropertyValue('--accent')
    };
    
    // ボタンやカードのスタイルを確認
    const button = document.querySelector('button');
    const buttonStyles = button ? window.getComputedStyle(button) : null;
    
    return {
      bodyBackground: computedStyle.backgroundColor,
      bodyColor: computedStyle.color,
      bodyFontFamily: computedStyle.fontFamily,
      hasTailwindClasses: !!hasTailwind,
      customCSSVariables: customVars,
      buttonStyles: buttonStyles ? {
        background: buttonStyles.backgroundColor,
        borderRadius: buttonStyles.borderRadius,
        padding: buttonStyles.padding
      } : null,
      // ページのHTML構造も確認
      hasMainContent: !!document.querySelector('main'),
      hasHeaders: !!document.querySelector('h1, h2, h3')
    };
  });
  
  console.log('CSS検証結果:');
  console.log('================');
  console.log('Body背景色:', styles.bodyBackground);
  console.log('Body文字色:', styles.bodyColor);
  console.log('フォント:', styles.bodyFontFamily);
  console.log('Tailwindクラス適用:', styles.hasTailwindClasses);
  console.log('カスタムCSS変数:', styles.customCSSVariables);
  console.log('ボタンスタイル:', styles.buttonStyles);
  console.log('メインコンテンツ:', styles.hasMainContent);
  console.log('見出し要素:', styles.hasHeaders);
  
  await browser.close();
})();