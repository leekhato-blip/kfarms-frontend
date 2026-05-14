const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  // Need to log in or something? 
  // Maybe just take a screenshot of whatever is there
  await page.screenshot({ path: '/home/lee/kfarms-frontend/actual_ui.png' });
  await browser.close();
})();
