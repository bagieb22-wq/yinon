const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching headless browser to test the frontend...");
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Go to the local HTML file
        const path = 'file://' + __dirname.replace(/\\/g, '/') + '/../index.html';
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        
        console.log("Waiting 2 seconds for initial render...");
        await new Promise(r => setTimeout(r, 2000));
        
        // Check initial state
        const initialTransform = await page.$eval('#hero-track', el => window.getComputedStyle(el).transform);
        console.log(`Initial Track Transform: ${initialTransform}`);
        
        const initialDot = await page.$$eval('.hero-dot', dots => {
            return dots.findIndex(d => d.classList.contains('active'));
        });
        console.log(`Initial Active Dot: ${initialDot}`);

        console.log("Waiting 5.5 seconds for auto-scroll...");
        await new Promise(r => setTimeout(r, 5500));
        
        // Check new state
        const newTransform = await page.$eval('#hero-track', el => window.getComputedStyle(el).transform);
        console.log(`New Track Transform: ${newTransform}`);
        
        const newDot = await page.$$eval('.hero-dot', dots => {
            return dots.findIndex(d => d.classList.contains('active'));
        });
        console.log(`New Active Dot: ${newDot}`);
        
        if (initialTransform !== newTransform && newDot === 1) {
            console.log("✅ FRONTEND TEST PASSED: The slider moved automatically to the next slide!");
        } else {
            console.error("❌ FRONTEND TEST FAILED: The slider did not move automatically.");
        }
        
        await browser.close();
    } catch (e) {
        console.error("Test failed due to exception:", e);
        process.exit(1);
    }
})();
