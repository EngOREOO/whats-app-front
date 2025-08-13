import { Client, LocalAuth } from 'whatsapp-web.js';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_BASE = process.env.WWEBJS_DATA_PATH || '/tmp/wwebjs_auth';

export async function createWhatsAppClient(sessionId?: string) {
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

  // Log puppeteer config on startup
  console.log('[PUPPETEER]', { executablePath, argsCount: args.length });

  await fs.mkdir(DATA_BASE, { recursive: true });

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: DATA_BASE,
      clientId: sessionId || 'default',
    }),
    puppeteer: { executablePath, headless: true, args },
  });

  return client;
}
