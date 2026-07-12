const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Go to local server
  await page.goto('http://127.0.0.1:8080');
  
  console.log("Page loaded. Taking screenshot of Home.");
  await page.screenshot({ path: 'home.png' });
  
  console.log("Clicking Experiment link...");
  await page.click('a[href="#experiment"]');
  
  // Wait a bit for animations
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Taking screenshot of Experiment.");
  await page.screenshot({ path: 'experiment.png' });
  
  const hash = await page.evaluate(() => window.location.hash);
  const experimentClasses = await page.evaluate(() => document.getElementById('experiment').className);
  console.log("Hash after click:", hash);
  console.log("Experiment div classes:", experimentClasses);
  
  await browser.close();
})();
