const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('file://' + __dirname.replace(/\\/g, '/') + '/../index.html', { waitUntil: 'domcontentloaded' });
        
        console.log("Checking how many slides are inside the track...");
        const count = await page.$$eval('.hero-slide', slides => slides.length);
        console.log("Number of slides (should be 6 with clone): " + count);

        // Jump to slide 5 (the clone)
        await page.evaluate(() => {
            currentSlide = 4;
            goToSlide(4);
        });
        
        // Wait 5 seconds for it to naturally transition to 5
        await new Promise(r => setTimeout(r, 5500));
        
        // Let's see what dot is active
        const activeDot = await page.$$eval('.hero-dot', dots => dots.findIndex(d => d.classList.contains('active')));
        console.log("Active dot after reaching the clone (should be 0): " + activeDot);
        
        if (count === 6 && activeDot === 0) {
            console.log("TEST PASSED: Infinite loop works!");
        } else {
            console.error("TEST FAILED");
        }
        await browser.close();
    } catch (e) {
        console.error("Test failed: ", e);
    }
})();
