import fs from "fs";
import path from "path";
import QRCode from "qrcode-terminal";
import { v4 as uuidv4 } from "uuid";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { config } from "../config";
import { SendMessageResponse, WhatsAppSession, BulkMessageRequest, BulkMessageResponse, BulkMessageStatus, PersonalizedBulkMessageRequest } from "../types";

export class WhatsAppService {
  private sessions: Map<string, { client: Client; session: WhatsAppSession }> =
    new Map();
  private bulkJobs: Map<string, BulkMessageStatus> = new Map();

  constructor() {
    this.ensureSessionDirectory();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(config.sessionPath)) {
      fs.mkdirSync(config.sessionPath, { recursive: true });
    }
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async delay(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  private replacePlaceholders(message: string, data: Record<string, any>): string {
    return message.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
      const value = data[placeholder];
      if (value === undefined) {
        throw new Error(`Placeholder {{${placeholder}}} not found in data object`);
      }
      return String(value);
    });
  }

  private validatePersonalizedData(data: Record<string, any>[], message: string): void {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Data array is required and must not be empty");
    }

    // Extract all placeholders from the message
    const placeholders = new Set<string>();
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = placeholderRegex.exec(message)) !== null) {
      placeholders.add(match[1]);
    }

    // Validate each data object
    data.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Data item at index ${index} must be an object`);
      }

      // Check if Phone field exists
      if (!item.Phone) {
        throw new Error(`Phone field is missing in data item at index ${index}`);
      }

      // Check if all placeholders exist in the data object
      placeholders.forEach(placeholder => {
        if (!(placeholder in item)) {
          throw new Error(`Placeholder {{${placeholder}}} not found in data item at index ${index}`);
        }
      });
    });
  }

  async createSession(sessionId?: string): Promise<WhatsAppSession> {
    const id = sessionId || uuidv4();

    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    if (this.sessions.size >= config.maxSessions) {
      throw new Error(
        `Maximum number of sessions (${config.maxSessions}) reached`
      );
    }

    const session: WhatsAppSession = {
      id,
      status: "initializing",
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: id,
        dataPath: path.join(config.sessionPath, id),
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    this.setupClientEvents(client, session);
    this.sessions.set(id, { client, session });

    try {
      await client.initialize();
      return session;
    } catch (error) {
      this.sessions.delete(id);
      throw new Error(`Failed to initialize session: ${error}`);
    }
  }

  private setupClientEvents(client: Client, session: WhatsAppSession): void {
    client.on("qr", (qr) => {
      session.qrCode = qr;
      session.status = "qr";
      console.log(`QR Code for session ${session.id}:`);
      QRCode.generate(qr, { small: true });
    });

    client.on("authenticated", () => {
      session.status = "authenticated";
      console.log(`Session ${session.id} authenticated`);
    });

    client.on("ready", async () => {
      session.status = "ready";
      const info = client.info;
      session.clientInfo = {
        pushname: info.pushname || "Unknown",
        wid: info.wid._serialized,
        platform: info.platform || "Unknown",
      };
      console.log(`Session ${session.id} is ready`);
    });

    client.on("disconnected", (reason) => {
      session.status = "disconnected";
      session.qrCode = undefined;
      session.clientInfo = undefined;
      console.log(`Session ${session.id} disconnected: ${reason}`);
    });

    client.on("auth_failure", (message) => {
      session.status = "disconnected";
      console.log(`Session ${session.id} authentication failed: ${message}`);
    });
  }

  getSession(sessionId: string): WhatsAppSession | null {
    const sessionData = this.sessions.get(sessionId);
    return sessionData ? sessionData.session : null;
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values()).map((data) => data.session);
  }

  async sendTextMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<SendMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (sessionData.session.status !== "ready") {
      return { success: false, error: "Session not ready" };
    }

    try {
      // Format phone number
      const chatId = to.includes("@") ? to : `${to.replace(/\D/g, "")}@c.us`;
      const sentMessage = await sessionData.client.sendMessage(chatId, message);

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendMediaMessage(
    sessionId: string,
    to: string,
    mediaPath: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (sessionData.session.status !== "ready") {
      return { success: false, error: "Session not ready" };
    }

    try {
      const media = MessageMedia.fromFilePath(mediaPath);
      const chatId = to.includes("@") ? to : `${to.replace(/\D/g, "")}@c.us`;

      const sentMessage = await sessionData.client.sendMessage(chatId, media, {
        caption: caption || undefined,
      });

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendBulkTextMessage(
    sessionId: string,
    bulkRequest: BulkMessageRequest
  ): Promise<BulkMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: "Session not found" 
      };
    }

    if (sessionData.session.status !== "ready") {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: "Session not ready" 
      };
    }

    if (!bulkRequest.numbers || bulkRequest.numbers.length === 0) {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: "No phone numbers provided" 
      };
    }

    const jobId = uuidv4();
    const delayRange = bulkRequest.delayRange || { min: 2, max: 9 };
    const totalNumbers = bulkRequest.numbers.length;
    
    // Calculate estimated duration
    const avgDelay = (delayRange.min + delayRange.max) / 2;
    const estimatedDuration = Math.ceil(totalNumbers * avgDelay);

    // Create job status
    const jobStatus: BulkMessageStatus = {
      jobId,
      status: 'pending',
      progress: {
        sent: 0,
        failed: 0,
        total: totalNumbers,
        percentage: 0
      },
      results: [],
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + estimatedDuration * 1000).toISOString()
    };

    this.bulkJobs.set(jobId, jobStatus);

    // Start bulk sending in background
    this.processBulkMessages(sessionId, jobId, bulkRequest, delayRange);

    return {
      success: true,
      jobId,
      totalNumbers,
      message: bulkRequest.message,
      estimatedDuration
    };
  }

  async sendPersonalizedBulkTextMessage(
    sessionId: string,
    personalizedRequest: PersonalizedBulkMessageRequest
  ): Promise<BulkMessageResponse> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: "Session not found" 
      };
    }

    if (sessionData.session.status !== "ready") {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: "Session not ready" 
      };
    }

    try {
      // Validate the data and message
      this.validatePersonalizedData(personalizedRequest.data, personalizedRequest.message);
    } catch (error) {
      return { 
        success: false, 
        jobId: "", 
        totalNumbers: 0, 
        message: "", 
        error: error instanceof Error ? error.message : "Validation error" 
      };
    }

    const jobId = uuidv4();
    const delayRange = personalizedRequest.delayRange || { min: 2, max: 9 };
    const totalNumbers = personalizedRequest.data.length;
    
    // Calculate estimated duration
    const avgDelay = (delayRange.min + delayRange.max) / 2;
    const estimatedDuration = Math.ceil(totalNumbers * avgDelay);

    // Create job status
    const jobStatus: BulkMessageStatus = {
      jobId,
      status: 'pending',
      progress: {
        sent: 0,
        failed: 0,
        total: totalNumbers,
        percentage: 0
      },
      results: [],
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + estimatedDuration * 1000).toISOString()
    };

    this.bulkJobs.set(jobId, jobStatus);

    // Start personalized bulk sending in background
    this.processPersonalizedBulkMessages(sessionId, jobId, personalizedRequest, delayRange);

    return {
      success: true,
      jobId,
      totalNumbers,
      message: personalizedRequest.message,
      estimatedDuration
    };
  }

  private async processBulkMessages(
    sessionId: string,
    jobId: string,
    bulkRequest: BulkMessageRequest,
    delayRange: { min: number; max: number }
  ): Promise<void> {
    const sessionData = this.sessions.get(sessionId);
    const jobStatus = this.bulkJobs.get(jobId);

    if (!sessionData || !jobStatus) {
      return;
    }

    jobStatus.status = 'running';

    for (let i = 0; i < bulkRequest.numbers.length; i++) {
      const number = bulkRequest.numbers[i];
      
      try {
        // Send message
        const result = await this.sendTextMessage(sessionId, number, bulkRequest.message);
        
        // Update job status
        jobStatus.results.push({
          number,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          sentAt: new Date().toISOString(),
          personalizedMessage: bulkRequest.message
        });

        if (result.success) {
          jobStatus.progress.sent++;
        } else {
          jobStatus.progress.failed++;
        }

        jobStatus.progress.percentage = Math.round(
          ((jobStatus.progress.sent + jobStatus.progress.failed) / jobStatus.progress.total) * 100
        );

        console.log(`Bulk job ${jobId}: Sent to ${number} - ${result.success ? 'Success' : 'Failed'}`);

        // Add random delay before next message (except for the last one)
        if (i < bulkRequest.numbers.length - 1) {
          const delay = this.getRandomDelay(delayRange.min, delayRange.max);
          console.log(`Bulk job ${jobId}: Waiting ${delay} seconds before next message...`);
          await this.delay(delay);
        }

      } catch (error) {
        jobStatus.results.push({
          number,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          sentAt: new Date().toISOString(),
          personalizedMessage: bulkRequest.message
        });
        jobStatus.progress.failed++;
        jobStatus.progress.percentage = Math.round(
          ((jobStatus.progress.sent + jobStatus.progress.failed) / jobStatus.progress.total) * 100
        );
        console.error(`Bulk job ${jobId}: Error sending to ${number}:`, error);
      }
    }

    // Mark job as completed
    jobStatus.status = 'completed';
    jobStatus.completedAt = new Date().toISOString();
    console.log(`Bulk job ${jobId}: Completed. Sent: ${jobStatus.progress.sent}, Failed: ${jobStatus.progress.failed}`);
  }

  private async processPersonalizedBulkMessages(
    sessionId: string,
    jobId: string,
    personalizedRequest: PersonalizedBulkMessageRequest,
    delayRange: { min: number; max: number }
  ): Promise<void> {
    const sessionData = this.sessions.get(sessionId);
    const jobStatus = this.bulkJobs.get(jobId);

    if (!sessionData || !jobStatus) {
      return;
    }

    jobStatus.status = 'running';

    for (let i = 0; i < personalizedRequest.data.length; i++) {
      const dataItem = personalizedRequest.data[i];
      const phoneNumber = dataItem.Phone;
      
      try {
        // Replace placeholders in the message
        const personalizedMessage = this.replacePlaceholders(personalizedRequest.message, dataItem);
        
        // Send personalized message
        const result = await this.sendTextMessage(sessionId, phoneNumber, personalizedMessage);
        
        // Update job status
        jobStatus.results.push({
          number: phoneNumber,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          sentAt: new Date().toISOString(),
          personalizedMessage: personalizedMessage
        });

        if (result.success) {
          jobStatus.progress.sent++;
        } else {
          jobStatus.progress.failed++;
        }

        jobStatus.progress.percentage = Math.round(
          ((jobStatus.progress.sent + jobStatus.progress.failed) / jobStatus.progress.total) * 100
        );

        console.log(`Personalized bulk job ${jobId}: Sent to ${phoneNumber} - ${result.success ? 'Success' : 'Failed'}`);
        console.log(`Message: ${personalizedMessage}`);

        // Add random delay before next message (except for the last one)
        if (i < personalizedRequest.data.length - 1) {
          const delay = this.getRandomDelay(delayRange.min, delayRange.max);
          console.log(`Personalized bulk job ${jobId}: Waiting ${delay} seconds before next message...`);
          await this.delay(delay);
        }

      } catch (error) {
        jobStatus.results.push({
          number: phoneNumber,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          sentAt: new Date().toISOString(),
          personalizedMessage: "Error occurred during placeholder replacement"
        });
        jobStatus.progress.failed++;
        jobStatus.progress.percentage = Math.round(
          ((jobStatus.progress.sent + jobStatus.progress.failed) / jobStatus.progress.total) * 100
        );
        console.error(`Personalized bulk job ${jobId}: Error sending to ${phoneNumber}:`, error);
      }
    }

    // Mark job as completed
    jobStatus.status = 'completed';
    jobStatus.completedAt = new Date().toISOString();
    console.log(`Personalized bulk job ${jobId}: Completed. Sent: ${jobStatus.progress.sent}, Failed: ${jobStatus.progress.failed}`);
  }

  getBulkJobStatus(jobId: string): BulkMessageStatus | null {
    return this.bulkJobs.get(jobId) || null;
  }

  getAllBulkJobs(): BulkMessageStatus[] {
    return Array.from(this.bulkJobs.values());
  }

  async logout(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return false;
    }

    try {
      await sessionData.client.logout();
      await sessionData.client.destroy();
      this.sessions.delete(sessionId);

      // Clean up session directory
      const sessionDir = path.join(config.sessionPath, sessionId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      return true;
    } catch (error) {
      console.error(`Error logging out session ${sessionId}:`, error);
      return false;
    }
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData) {
      return false;
    }

    try {
      await sessionData.client.destroy();
      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error(`Error destroying session ${sessionId}:`, error);
      return false;
    }
  }
}
