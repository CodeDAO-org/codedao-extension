// scripts/marketplace-upload.js
const { chromium } = require('playwright');

(async () => {
  const vsixPath = process.env.VSIX_PATH;
  const email = process.env.MKT_EMAIL;
  const password = process.env.MKT_PASSWORD;
  const publisher = process.env.MKT_PUBLISHER;
  const timeout = 120000;

  if (!vsixPath || !email || !password || !publisher) {
    console.error('Missing required env variables: VSIX_PATH, MKT_EMAIL, MKT_PASSWORD, MKT_PUBLISHER');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://marketplace.visualstudio.com/');
    await page.click('text=Sign in');
    await page.fill('input[type=email]', email);
    await page.click('text=Next');
    await page.waitForTimeout(2000);
    await page.fill('input[type=password]', password);
    await page.click('text=Sign in');
    await page.waitForNavigation({ timeout });

    await page.goto(`https://marketplace.visualstudio.com/manage/publishers/${publisher}/extensions`);
    await page.waitForSelector('text=New extension', { timeout });
    await page.click('text=New extension');

    await page.waitForSelector('input[type=file]', { timeout });
    const fileHandle = await page.$('input[type=file]');
    await fileHandle.setInputFiles(vsixPath);

    await page.waitForSelector('button:has-text("Upload")', { timeout });
    await page.click('button:has-text("Upload")');

    await page.waitForSelector('text=Make Public', { timeout });
    console.log('Upload succeeded');

  } catch (err) {
    console.error('Upload failed:', err);
    await page.screenshot({ path: 'upload-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
