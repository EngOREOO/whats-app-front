import type { Request, Response } from 'express';
import puppeteer from 'puppeteer-core';

export async function diagPuppeteer(req: Request, res: Response): Promise<void> {
  try {
    const executablePath = '/usr/bin/chromium'; // hard lock for Cloud Run Docker image
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--headless=new'
    ];
    const start = Date.now();
    const browser = await puppeteer.launch({ 
      executablePath, 
      headless: true, 
      args, 
      timeout: 60000 
    });
    const page = await browser.newPage();
    await page.goto('https://example.com', { 
      waitUntil: 'domcontentloaded', 
      timeout: 45000 
    });
    const title = await page.title();
    await browser.close();
    res.status(200).json({
      ok: true,
      elapsedMs: Date.now() - start,
      executablePath,
      argsCount: args.length,
      title,
      env: { 
        NODE_ENV: process.env.NODE_ENV, 
        CHROMIUM_PATH: process.env.CHROMIUM_PATH 
      }
    });
  } catch (err: any) {
    console.error('[DIAG_PPTR_ERROR]', { 
      name: err?.name, 
      message: err?.message, 
      stack: err?.stack 
    });
    res.status(500).json({ 
      ok: false, 
      name: err?.name, 
      message: String(err?.message || err) 
    });
  }
}
