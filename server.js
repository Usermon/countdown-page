const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = 'https://www.timeanddate.com/countdown/generic';

let latestScreenshotBuffer = null;

async function takeScreenshot() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no‑sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
      // Optionally specify executablePath if using a non‑default Chromium
    });
    const page = await browser.newPage();
    // adjust size for mobile / iPad view
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    const buffer = await page.screenshot({ fullPage: false });
    latestScreenshotBuffer = buffer;
    await browser.close();
  } catch (err) {
    console.error('Error taking screenshot:', err);
  }
}

// Take an initial screenshot
takeScreenshot();
// Schedule periodic screenshots
setInterval(takeScreenshot, 10000);  // every 10 seconds; adjust if needed

// Serve endpoints
app.get('/latest.png', (req, res) => {
  if (!latestScreenshotBuffer) {
    return res.status(503).send('No image yet');
  }
  res.set('Content-Type', 'image/png');
  res.send(latestScreenshotBuffer);
});

app.get('/', (req, res) => {
  // A simple page showing the screenshot + auto refresh
  res.send(`
    <html>
      <head><title>Countdown Display</title></head>
      <body style="margin:0; padding:0; overflow:hidden; background:#000;">
        <img src="/latest.png" style="width:100%; height:auto;" />
        <script>
          setTimeout(function(){
            window.location.reload();
          }, 15000);  // refresh every 15 seconds
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
