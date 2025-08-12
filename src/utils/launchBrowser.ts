// src/utils/launchBrowser.ts
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';

const execPath = process.env.CHROMIUM_PATH || '/usr/bin/chromium'; // Cloud Run (Debian) default

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

// For whatsapp-web.js compatibility - returns Puppeteer options instead of launching directly
// since whatsapp-web.js handles the browser launch internally
export function getPuppeteerOptions() {
  return {
    headless: true,
    executablePath: execPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-accelerated-2d-canvas',
    ],
  };
}
