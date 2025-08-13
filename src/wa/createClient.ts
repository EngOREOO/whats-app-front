import { Client, LocalAuth } from 'whatsapp-web.js';
import chromium from '@sparticuz/chromium';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_BASE = process.env.WWEBJS_DATA_PATH || '/tmp/wwebjs_auth';

export async function createWhatsAppClient(sessionId?: string) {
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

  // Log chromium config on first init
  console.log(`[WhatsApp] Chromium executablePath: ${executablePath}, args count: ${args.length}`);

  await fs.mkdir(DATA_BASE, { recursive: true });

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: DATA_BASE,
      clientId: sessionId || 'default',
    }),
    puppeteer: { executablePath, args, headless },
  });

  return client;
}
