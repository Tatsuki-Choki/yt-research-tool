const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1920x1080のデスクトップサイズ
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  const analysis = await page.evaluate(() => {
    // lg:block要素を探す
    const lgBlockElements = document.querySelectorAll('.hidden.lg\\:block');
    const lgHiddenElements = document.querySelectorAll('.lg\\:hidden');
    
    // 実際に計算されたスタイルを確認
    const lgBlockStyles = Array.from(lgBlockElements).map((el, index) => {
      const computed = window.getComputedStyle(el);
      return {
        index,
        display: computed.display,
        visibility: computed.visibility,
        classes: el.className,
        text: el.textContent?.substring(0, 50),
        parentClasses: el.parentElement?.className
      };
    });
    
    const lgHiddenStyles = Array.from(lgHiddenElements).map((el, index) => {
      const computed = window.getComputedStyle(el);
      return {
        index,
        display: computed.display,
        visibility: computed.visibility,
        classes: el.className,
        text: el.textContent?.substring(0, 50)
      };
    });
    
    // viewport幅を確認
    const viewportWidth = window.innerWidth;
    
    // Tailwindのブレークポイントを確認
    const breakpoints = {
      sm: window.matchMedia('(min-width: 640px)').matches,
      md: window.matchMedia('(min-width: 768px)').matches,
      lg: window.matchMedia('(min-width: 1024px)').matches,
      xl: window.matchMedia('(min-width: 1280px)').matches,
      '2xl': window.matchMedia('(min-width: 1536px)').matches
    };
    
    // メディアクエリの実際の状態
    const mediaQueryStatus = {
      'min-1024': window.matchMedia('(min-width: 1024px)').matches,
      'min-768': window.matchMedia('(min-width: 768px)').matches,
      'min-640': window.matchMedia('(min-width: 640px)').matches
    };
    
    // スタイルシートにTailwindのルールが含まれているか
    let hasTailwindRules = false;
    for (let sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        if (rules.some(rule => rule.cssText?.includes('@media (min-width: 1024px)'))) {
          hasTailwindRules = true;
          break;
        }
      } catch (e) {
        // CORSエラーなど
      }
    }
    
    return {
      viewportWidth,
      breakpoints,
      mediaQueryStatus,
      hasTailwindRules,
      lgBlockElements: {
        count: lgBlockElements.length,
        samples: lgBlockStyles.slice(0, 3)
      },
      lgHiddenElements: {
        count: lgHiddenElements.length,
        samples: lgHiddenStyles.slice(0, 3)
      }
    };
  });
  
  console.log('=== Tailwind CSS診断結果 ===');
  console.log('Viewport幅:', analysis.viewportWidth);
  console.log('\nブレークポイントの状態:');
  Object.entries(analysis.breakpoints).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅ アクティブ' : '❌ 非アクティブ'}`);
  });
  
  console.log('\nメディアクエリの実際の状態:');
  Object.entries(analysis.mediaQueryStatus).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\nTailwindルール検出:', analysis.hasTailwindRules ? '✅' : '❌');
  
  console.log('\nlg:block要素 (デスクトップで表示されるべき):');
  console.log('  要素数:', analysis.lgBlockElements.count);
  if (analysis.lgBlockElements.samples.length > 0) {
    analysis.lgBlockElements.samples.forEach((el, i) => {
      console.log(`  [${i}] display: ${el.display}, classes: ${el.classes}`);
      if (el.display === 'none') {
        console.log('    ❌ 問題: この要素が非表示になっています！');
      }
    });
  }
  
  console.log('\nlg:hidden要素 (デスクトップで非表示になるべき):');
  console.log('  要素数:', analysis.lgHiddenElements.count);
  if (analysis.lgHiddenElements.samples.length > 0) {
    analysis.lgHiddenElements.samples.forEach((el, i) => {
      console.log(`  [${i}] display: ${el.display}, classes: ${el.classes}`);
      if (el.display !== 'none') {
        console.log('    ❌ 問題: この要素が表示されています！');
      }
    });
  }
  
  await browser.close();
})();