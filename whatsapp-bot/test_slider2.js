const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('file://' + __dirname.replace(/\\/g, '/') + '/../index.html', { waitUntil: 'domcontentloaded' });
        
        console.log("Page loaded. Checking initial slider state...");
        
        let transform = await page.$eval('#hero-track', el => el.style.transform);
        console.log("Initial Transform: " + transform);
        
        let activeDot = await page.$$eval('.hero-dot', dots => {
            let index = -1;
            dots.forEach((dot, i) => { if(dot.classList.contains('active')) index = i; });
            return index;
        });
        console.log("Initial Active Dot Index: " + activeDot);

        console.log("Waiting 6 seconds for the automatic carousel rotation...");
        await page.waitForTimeout(6000);

        let newTransform = await page.$eval('#hero-track', el => el.style.transform);
        console.log("New Transform: " + newTransform);

        let newActiveDot = await page.$$eval('.hero-dot', dots => {
            let index = -1;
            dots.forEach((dot, i) => { if(dot.classList.contains('active')) index = i; });
            return index;
        });
        console.log("New Active Dot Index: " + newActiveDot);
        
        if (activeDot === 0 && newActiveDot === 1 && newTransform !== transform) {
            console.log("TEST PASSED: Slider successfully transitioned automatically!");
        } else {
            console.log("TEST FAILED: Slider did not transition correctly.");
        }
        
        await browser.close();
    } catch (e) {
        console.error("Error during test: ", e);
    }
})();
