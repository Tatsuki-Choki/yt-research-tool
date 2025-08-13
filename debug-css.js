const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 実際に生成されたCSSルールを確認
  const cssInfo = await page.evaluate(() => {
    const results = {
      stylesheets: [],
      lgBlockElements: [],
      computedStyles: {},
      tailwindFound: false
    };
    
    // スタイルシート内のルールを確認
    for (let sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        let sheetInfo = {
          href: sheet.href || 'inline',
          totalRules: rules.length,
          mediaQueries: [],
          lgRules: []
        };
        
        for (let rule of rules) {
          const cssText = rule.cssText || '';
          
          // メディアクエリを探す
          if (cssText.includes('@media')) {
            sheetInfo.mediaQueries.push(cssText.substring(0, 100));
          }
          
          // lg:に関連するルールを探す
          if (cssText.includes('lg\\:') || cssText.includes('lg:')) {
            sheetInfo.lgRules.push(cssText.substring(0, 200));
            results.tailwindFound = true;
          }
        }
        
        if (sheetInfo.mediaQueries.length > 0 || sheetInfo.lgRules.length > 0) {
          results.stylesheets.push(sheetInfo);
        }
      } catch (e) {
        // CORS or other errors
      }
    }
    
    // lg:block要素の実際のクラス名を確認
    const lgElements = document.querySelectorAll('[class*="lg"]');
    for (let el of lgElements) {
      results.lgBlockElements.push({
        tagName: el.tagName,
        className: el.className,
        computedDisplay: window.getComputedStyle(el).display
      });
    }
    
    // 特定の要素のスタイルを詳しく確認
    const testEl = document.querySelector('.hidden.lg\\:block');
    if (testEl) {
      const computed = window.getComputedStyle(testEl);
      results.computedStyles = {
        display: computed.display,
        className: testEl.className,
        classList: Array.from(testEl.classList)
      };
    }
    
    return results;
  });
  
  console.log('=== CSS解析結果 ===\n');
  console.log('Tailwindルール検出:', cssInfo.tailwindFound ? '✅' : '❌');
  
  console.log('\n--- スタイルシート情報 ---');
  for (let sheet of cssInfo.stylesheets) {
    console.log(`\nソース: ${sheet.href}`);
    console.log(`  総ルール数: ${sheet.totalRules}`);
    console.log(`  メディアクエリ数: ${sheet.mediaQueries.length}`);
    console.log(`  lg:ルール数: ${sheet.lgRules.length}`);
    
    if (sheet.lgRules.length > 0) {
      console.log('  lg:ルールのサンプル:');
      sheet.lgRules.slice(0, 3).forEach(rule => {
        console.log(`    ${rule}`);
      });
    }
  }
  
  console.log('\n--- lg:を含む要素 ---');
  cssInfo.lgBlockElements.slice(0, 5).forEach((el, i) => {
    console.log(`[${i}] ${el.tagName}: "${el.className}" => display: ${el.computedDisplay}`);
  });
  
  if (cssInfo.computedStyles.className) {
    console.log('\n--- テスト要素の詳細 ---');
    console.log('className:', cssInfo.computedStyles.className);
    console.log('classList:', cssInfo.computedStyles.classList);
    console.log('display:', cssInfo.computedStyles.display);
  }
  
  // 生成されたHTMLも確認
  const htmlSample = await page.evaluate(() => {
    const el = document.querySelector('.hidden.lg\\:block');
    return el ? el.outerHTML.substring(0, 200) : null;
  });
  
  if (htmlSample) {
    console.log('\n--- HTML要素のサンプル ---');
    console.log(htmlSample);
  }
  
  await browser.close();
})();