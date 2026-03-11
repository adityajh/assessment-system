const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to the Vercel staging app...");
    await page.goto("https://assessment-system-beta.vercel.app/admin/rubrics", { waitUntil: "networkidle" });

    console.log("Taking screenshot...");
    await page.screenshot({ path: "/Users/adityajhunjhunwala/.gemini/antigravity/brain/789eed74-13e5-45fe-abd2-642162c600ee/vercel_rubric_check.png", fullPage: true });

    await browser.close();
    console.log("Screenshot saved.");
})();
