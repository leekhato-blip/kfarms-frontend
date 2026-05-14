import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  
  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'desktop.png' });
  
  // Mobile
  await page.setViewport({ width: 375, height: 667 });
  await page.screenshot({ path: 'mobile.png' });

  await browser.close();
})();
