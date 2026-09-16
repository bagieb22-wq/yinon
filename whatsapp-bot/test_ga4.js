const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Listen to network requests
    page.on('request', request => {
        if (request.url().includes('google-analytics.com/g/collect')) {
            console.log('SUCCESS! GA4 Hit detected:', request.url());
        }
    });

    await page.goto('https://bagieb22-wq.github.io/yinon/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
