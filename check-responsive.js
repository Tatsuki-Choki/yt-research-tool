const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  // デスクトップサイズで確認
  console.log('=== デスクトップ表示の確認 (1920x1080) ===');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewportSize({ width: 1920, height: 1080 });
  await desktopPage.goto('http://localhost:3000');
  await desktopPage.waitForLoadState('networkidle');
  
  const desktopLayout = await desktopPage.evaluate(() => {
    const main = document.querySelector('main');
    const container = document.querySelector('.container, .max-w-7xl, [class*="max-w"]');
    const grid = document.querySelector('.grid, [class*="grid-cols"]');
    const flexElements = document.querySelectorAll('[class*="flex"]');
    const hiddenMobile = document.querySelectorAll('[class*="hidden"], [class*="md:block"], [class*="lg:block"]');
    
    // レイアウト幅を確認
    const bodyWidth = document.body.clientWidth;
    const mainWidth = main ? main.clientWidth : null;
    const containerWidth = container ? container.clientWidth : null;
    
    // グリッドカラム数を確認
    let gridCols = null;
    if (grid) {
      const gridClass = grid.className;
      const colsMatch = gridClass.match(/grid-cols-(\d+)|md:grid-cols-(\d+)|lg:grid-cols-(\d+)/);
      gridCols = colsMatch ? colsMatch[1] || colsMatch[2] || colsMatch[3] : null;
    }
    
    // デスクトップ専用要素の表示状態
    const desktopElements = Array.from(document.querySelectorAll('[class*="md:"], [class*="lg:"]')).map(el => ({
      classes: el.className,
      display: window.getComputedStyle(el).display,
      width: el.clientWidth
    }));
    
    return {
      bodyWidth,
      mainWidth,
      containerWidth,
      hasGrid: !!grid,
      gridColumns: gridCols,
      flexElementsCount: flexElements.length,
      hiddenMobileCount: hiddenMobile.length,
      desktopElementsSample: desktopElements.slice(0, 5),
      // ナビゲーションバーの確認
      hasDesktopNav: !!document.querySelector('nav [class*="md:flex"], nav [class*="lg:flex"]'),
      // サイドバーの確認
      hasSidebar: !!document.querySelector('aside, [class*="sidebar"]')
    };
  });
  
  console.log('Body幅:', desktopLayout.bodyWidth);
  console.log('Main幅:', desktopLayout.mainWidth);
  console.log('Container幅:', desktopLayout.containerWidth);
  console.log('グリッド使用:', desktopLayout.hasGrid);
  console.log('グリッドカラム数:', desktopLayout.gridColumns);
  console.log('Flex要素数:', desktopLayout.flexElementsCount);
  console.log('デスクトップ専用ナビ:', desktopLayout.hasDesktopNav);
  console.log('サイドバー:', desktopLayout.hasSidebar);
  
  // モバイルサイズで確認
  console.log('\n=== モバイル表示の確認 (375x667) ===');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 667 });
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.waitForLoadState('networkidle');
  
  const mobileLayout = await mobilePage.evaluate(() => {
    const main = document.querySelector('main');
    const container = document.querySelector('.container, .max-w-7xl, [class*="max-w"]');
    const bodyWidth = document.body.clientWidth;
    const mainWidth = main ? main.clientWidth : null;
    const containerWidth = container ? container.clientWidth : null;
    
    // モバイルメニューの確認
    const hamburger = document.querySelector('[class*="burger"], [class*="menu-btn"], button[aria-label*="menu"]');
    const mobileNav = document.querySelector('[class*="mobile-nav"], [class*="md:hidden"]');
    
    return {
      bodyWidth,
      mainWidth,
      containerWidth,
      hasHamburgerMenu: !!hamburger,
      hasMobileNav: !!mobileNav
    };
  });
  
  console.log('Body幅:', mobileLayout.bodyWidth);
  console.log('Main幅:', mobileLayout.mainWidth);
  console.log('Container幅:', mobileLayout.containerWidth);
  console.log('ハンバーガーメニュー:', mobileLayout.hasHamburgerMenu);
  console.log('モバイルナビ:', mobileLayout.hasMobileNav);
  
  // レスポンシブの問題を診断
  console.log('\n=== 診断結果 ===');
  if (desktopLayout.containerWidth && desktopLayout.containerWidth < 500) {
    console.log('❌ 問題: デスクトップでもコンテナ幅が狭い（モバイル表示になっている可能性）');
  } else if (desktopLayout.containerWidth && desktopLayout.containerWidth > 1000) {
    console.log('✅ デスクトップでコンテナ幅が適切');
  }
  
  if (!desktopLayout.hasGrid && desktopLayout.flexElementsCount < 2) {
    console.log('⚠️ 警告: レスポンシブレイアウト要素が少ない');
  }
  
  await browser.close();
})();