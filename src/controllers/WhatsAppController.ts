import { Request, Response } from "express";
import fs from "fs";
import { WhatsAppService } from "../services/WhatsAppService";
import { ApiResponse } from "../types";

export class WhatsAppController {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * @swagger
   * /api/sessions:
   *   post:
   *     summary: Create a new WhatsApp session
   *     tags: [Sessions]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: Optional custom session ID
   *     responses:
   *       201:
   *         description: Session created successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;
      const session = await this.whatsappService.createSession(sessionId);

      const response: ApiResponse = {
        success: true,
        data: session,
        message: "Session created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(400).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions:
   *   get:
   *     summary: Get all sessions
   *     tags: [Sessions]
   *     responses:
   *       200:
   *         description: List of all sessions
   */
  getAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = this.whatsappService.getAllSessions();

      const response: ApiResponse = {
        success: true,
        data: sessions,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}:
   *   get:
   *     summary: Get session status
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session status retrieved successfully
   *       404:
   *         description: Session not found
   */
  getSessionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = this.whatsappService.getSession(sessionId);

      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: "Session not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: session,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}/send-text:
   *   post:
   *     summary: Send text message
   *     tags: [Messages]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - to
   *               - message
   *             properties:
   *               to:
   *                 type: string
   *                 description: Phone number or chat ID
   *               message:
   *                 type: string
   *                 description: Text message to send
   *     responses:
   *       200:
   *         description: Message sent successfully
   *       400:
   *         description: Bad request
   *       404:
   *         description: Session not found
   */
  sendTextMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { to, message } = req.body;

      if (!to || !message) {
        const response: ApiResponse = {
          success: false,
          error: "Missing required fields: to, message",
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.whatsappService.sendTextMessage(
        sessionId,
        to,
        message
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? { messageId: result.messageId } : undefined,
        error: result.error,
      };

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}/send-bulk-text:
   *   post:
   *     summary: Send bulk text messages to multiple numbers with random delays
   *     tags: [Bulk Messages]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - numbers
   *               - message
   *             properties:
   *               numbers:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of phone numbers to send messages to
   *                 example: ["1234567890", "0987654321"]
   *               message:
   *                 type: string
   *                 description: Text message to send to all numbers
   *               delayRange:
   *                 type: object
   *                 properties:
   *                   min:
   *                     type: number
   *                     description: Minimum delay in seconds between messages
   *                     default: 2
   *                   max:
   *                     type: number
   *                     description: Maximum delay in seconds between messages
   *                     default: 9
   *     responses:
   *       200:
   *         description: Bulk message job started successfully
   *       400:
   *         description: Bad request
   *       404:
   *         description: Session not found
   */
  sendBulkTextMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { numbers, message, delayRange } = req.body;

      if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: "Missing or invalid numbers array",
        };
        res.status(400).json(response);
        return;
      }

      if (!message || typeof message !== 'string') {
        const response: ApiResponse = {
          success: false,
          error: "Missing or invalid message",
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.whatsappService.sendBulkTextMessage(
        sessionId,
        { numbers, message, delayRange }
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          jobId: result.jobId,
          totalNumbers: result.totalNumbers,
          message: result.message,
          estimatedDuration: result.estimatedDuration
        } : undefined,
        error: result.error,
        message: result.success ? "Bulk message job started successfully" : undefined,
      };

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}/send-personalized-bulk-text:
   *   post:
   *     summary: Send personalized bulk text messages with dynamic placeholders
   *     tags: [Bulk Messages]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *               - data
   *             properties:
   *               message:
   *                 type: string
   *                 description: Message template with placeholders (e.g., "Hello {{Name}}, your code is {{Code}}")"
   *                 example: "Hello {{Name}}, your code is {{Code}}"
   *               data:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - Phone
   *                   properties:
   *                     Phone:
   *                       type: string
   *                       description: Phone number for the recipient
   *                       example: "+201122267427"
   *                     Name:
   *                       type: string
   *                       description: Name placeholder value
   *                       example: "Ahmed Kabary"
   *                     Code:
   *                       type: string
   *                       description: Code placeholder value
   *                       example: "3256888"
   *                 description: Array of data objects containing Phone and placeholder values
   *                 example: [
   *                   {
   *                     "Phone": "+201122267427",
   *                     "Name": "Ahmed Kabary",
   *                     "Code": "3256888"
   *                   },
   *                   {
   *                     "Phone": "+201061370451",
   *                     "Name": "Sarah Johnson",
   *                     "Code": "3256889"
   *                   }
   *                 ]
   *               delayRange:
   *                 type: object
   *                 properties:
   *                   min:
   *                     type: number
   *                     description: Minimum delay in seconds between messages
   *                     default: 2
   *                   max:
   *                     type: number
   *                     description: Maximum delay in seconds between messages
   *                     default: 9
   *     responses:
   *       200:
   *         description: Personalized bulk message job started successfully
   *       400:
   *         description: Bad request - validation error
   *       404:
   *         description: Session not found
   */
  sendPersonalizedBulkTextMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { message, data, delayRange } = req.body;

      if (!message || typeof message !== 'string') {
        const response: ApiResponse = {
          success: false,
          error: "Missing or invalid message template",
        };
        res.status(400).json(response);
        return;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: "Missing or invalid data array",
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.whatsappService.sendPersonalizedBulkTextMessage(
        sessionId,
        { message, data, delayRange }
      );

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          jobId: result.jobId,
          totalNumbers: result.totalNumbers,
          message: result.message,
          estimatedDuration: result.estimatedDuration
        } : undefined,
        error: result.error,
        message: result.success ? "Personalized bulk message job started successfully" : undefined,
      };

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/bulk-jobs/{jobId}:
   *   get:
   *     summary: Get bulk message job status
   *     tags: [Bulk Messages]
   *     parameters:
   *       - in: path
   *         name: jobId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Job status retrieved successfully
   *       404:
   *         description: Job not found
   */
  getBulkJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      const jobStatus = this.whatsappService.getBulkJobStatus(jobId);

      if (!jobStatus) {
        const response: ApiResponse = {
          success: false,
          error: "Job not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: jobStatus,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/bulk-jobs:
   *   get:
   *     summary: Get all bulk message jobs
   *     tags: [Bulk Messages]
   *     responses:
   *       200:
   *         description: List of all bulk message jobs
   */
  getAllBulkJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobs = this.whatsappService.getAllBulkJobs();

      const response: ApiResponse = {
        success: true,
        data: jobs,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}/send-media:
   *   post:
   *     summary: Send media message
   *     tags: [Messages]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - to
   *               - file
   *             properties:
   *               to:
   *                 type: string
   *                 description: Phone number or chat ID
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Media file to send
   *               caption:
   *                 type: string
   *                 description: Optional caption for the media
   *     responses:
   *       200:
   *         description: Media sent successfully
   *       400:
   *         description: Bad request
   *       404:
   *         description: Session not found
   */
  sendMediaMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { to, caption } = req.body;
      const file = req.file;

      if (!to || !file) {
        const response: ApiResponse = {
          success: false,
          error: "Missing required fields: to, file",
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.whatsappService.sendMediaMessage(
        sessionId,
        to,
        file.path,
        caption
      );

      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? { messageId: result.messageId } : undefined,
        error: result.error,
      };

      res.status(result.success ? 200 : 400).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}/logout:
   *   post:
   *     summary: Logout from session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Logged out successfully
   *       404:
   *         description: Session not found
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const success = await this.whatsappService.logout(sessionId);

      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: "Session not found or logout failed",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Logged out successfully",
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };

  /**
   * @swagger
   * /api/sessions/{sessionId}:
   *   delete:
   *     summary: Destroy session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session destroyed successfully
   *       404:
   *         description: Session not found
   */
  destroySession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const success = await this.whatsappService.destroySession(sessionId);

      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: "Session not found or destroy failed",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Session destroyed successfully",
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(500).json(response);
    }
  };
}
