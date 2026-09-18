const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('file://' + __dirname.replace(/\\/g, '/') + '/../index.html', { waitUntil: 'domcontentloaded' });
        
        const htmlContent = await page.content();
        if (htmlContent.includes('#3a506b') && !htmlContent.includes('#c85a44"')) {
            console.log("TEST PASSED: Red color was successfully replaced with Steel Blue.");
        } else {
            console.error("TEST FAILED: Color replacement did not work correctly.");
        }
        
        await browser.close();
    } catch (e) {
        console.error("Test failed: ", e);
    }
})();
