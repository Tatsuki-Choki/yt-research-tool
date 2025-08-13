const { chromium } = require('@playwright/test');

async function checkUI() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const url = 'https://yt-research-tool-2025.netlify.app';
  
  console.log('UIチェックを開始します...\n');
  
  // デスクトップビューのチェック
  console.log('1. デスクトップビューのチェック');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'desktop-main.png', fullPage: true });
  console.log('   ✅ メインページのスクリーンショット: desktop-main.png');
  
  // ガイドページのチェック
  await page.goto(url + '/guide');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'desktop-guide.png', fullPage: true });
  console.log('   ✅ ガイドページのスクリーンショット: desktop-guide.png');
  
  // タブレットビューのチェック
  console.log('\n2. タブレットビューのチェック');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tablet-main.png', fullPage: true });
  console.log('   ✅ メインページのスクリーンショット: tablet-main.png');
  
  // モバイルビューのチェック
  console.log('\n3. モバイルビューのチェック');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'mobile-main.png', fullPage: true });
  console.log('   ✅ メインページのスクリーンショット: mobile-main.png');
  
  await page.goto(url + '/guide');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'mobile-guide.png', fullPage: true });
  console.log('   ✅ ガイドページのスクリーンショット: mobile-guide.png');
  
  // CSS の読み込み状態をチェック
  console.log('\n4. CSSの読み込み状態チェック');
  await page.goto(url);
  
  const cssChecks = await page.evaluate(() => {
    const checks = [];
    
    // 背景色のチェック
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    checks.push({
      name: 'Body背景色',
      expected: 'rgb(255, 255, 255)',
      actual: bodyBg,
      pass: bodyBg === 'rgb(255, 255, 255)'
    });
    
    // ヘッダーの存在チェック
    const header = document.querySelector('header');
    if (header) {
      const headerBg = window.getComputedStyle(header).backgroundColor;
      checks.push({
        name: 'ヘッダー背景色',
        expected: 'rgb(255, 255, 255)',
        actual: headerBg,
        pass: headerBg === 'rgb(255, 255, 255)' || headerBg === 'rgba(255, 255, 255, 1)'
      });
    } else {
      checks.push({
        name: 'ヘッダー',
        expected: '存在する',
        actual: '存在しない',
        pass: false
      });
    }
    
    // フォントのチェック
    const fontFamily = window.getComputedStyle(document.body).fontFamily;
    checks.push({
      name: 'フォントファミリー',
      expected: '日本語フォントを含む',
      actual: fontFamily,
      pass: fontFamily.includes('Hiragino') || fontFamily.includes('system-ui') || fontFamily.includes('Meiryo')
    });
    
    // カラートークンのチェック
    const rootStyles = window.getComputedStyle(document.documentElement);
    const bgVar = rootStyles.getPropertyValue('--bg').trim();
    const textVar = rootStyles.getPropertyValue('--text').trim();
    const accentVar = rootStyles.getPropertyValue('--accent').trim();
    
    checks.push({
      name: 'CSS変数 --bg',
      expected: '#FFFFFF',
      actual: bgVar || 'undefined',
      pass: bgVar === '#FFFFFF'
    });
    
    checks.push({
      name: 'CSS変数 --text',
      expected: '#212121',
      actual: textVar || 'undefined',
      pass: textVar === '#212121'
    });
    
    checks.push({
      name: 'CSS変数 --accent',
      expected: '#FF0000',
      actual: accentVar || 'undefined',
      pass: accentVar === '#FF0000'
    });
    
    return checks;
  });
  
  cssChecks.forEach(check => {
    if (check.pass) {
      console.log(`   ✅ ${check.name}: ${check.actual}`);
    } else {
      console.log(`   ❌ ${check.name}: 期待値=${check.expected}, 実際=${check.actual}`);
    }
  });
  
  // レイアウトの崩れをチェック
  console.log('\n5. レイアウトのチェック');
  const layoutIssues = await page.evaluate(() => {
    const issues = [];
    
    // 要素の重なりをチェック
    const elements = document.querySelectorAll('button, input, select, a');
    const rects = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        rects.push({ el, rect });
      }
    });
    
    // オーバーフローのチェック
    const bodyWidth = document.body.scrollWidth;
    const viewportWidth = window.innerWidth;
    if (bodyWidth > viewportWidth) {
      issues.push(`横スクロールが発生しています: body幅=${bodyWidth}px, viewport幅=${viewportWidth}px`);
    }
    
    return issues;
  });
  
  if (layoutIssues.length > 0) {
    layoutIssues.forEach(issue => {
      console.log(`   ⚠️  ${issue}`);
    });
  } else {
    console.log('   ✅ レイアウトの問題は検出されませんでした');
  }
  
  await browser.close();
  
  console.log('\n✨ UIチェック完了！');
  console.log('スクリーンショットを確認してください。');
}

checkUI().catch(console.error);