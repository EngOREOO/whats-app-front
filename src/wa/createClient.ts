import { Client, LocalAuth } from 'whatsapp-web.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function createWhatsAppClient(sessionId?: string): Promise<Client> {
  const executablePath = await chromium.executablePath();
  const args = [
    ...chromium.args,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-zygote',
    '--single-process',
  ];
  const headless = true; // Always headless in Cloud Run

  const auth = new LocalAuth({
    // NOTE: Cloud Run is stateless; prefer external storage later.
    dataPath: process.env.WWEBJS_DATA_PATH || './.wwebjs_auth',
    clientId: sessionId || 'default',
  });

  const client = new Client({
    authStrategy: auth,
    puppeteer: { executablePath, args, headless },
  });

  return client;
}
