const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting browser to visit website...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Make it look like a real user
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to https://bagieb22-wq.github.io/yinon/ ...');
    await page.goto('https://bagieb22-wq.github.io/yinon/', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Waiting for Google Analytics tags to fire...');
    
    // Wait for 5 seconds and scroll around
    await page.evaluate(() => {
        window.scrollBy(0, 500);
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        window.scrollBy(0, 500);
    });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Visit complete. Closing browser.');
    await browser.close();
})();
