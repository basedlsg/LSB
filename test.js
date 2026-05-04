const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  await page.goto('http://localhost:3005/', { waitUntil: 'networkidle0' });
  const canvases = await page.$$eval('canvas', els => els.map(e => e.outerHTML));
  console.log('CANVASES:', canvases.length);
  await browser.close();
})();
