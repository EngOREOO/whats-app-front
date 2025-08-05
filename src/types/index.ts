export interface WhatsAppSession {
  id: string;
  status: 'initializing' | 'qr' | 'authenticated' | 'ready' | 'disconnected';
  qrCode?: string;
  clientInfo?: {
    pushname: string;
    wid: string;
    platform: string;
  };
}

export interface SendMessageRequest {
  sessionId: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video';
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkMessageRequest {
  numbers: string[];
  message: string;
  delayRange?: {
    min: number; // seconds
    max: number; // seconds
  };
}

export interface PersonalizedBulkMessageRequest {
  message: string;
  data: Record<string, any>[]; // Array of objects with Phone and other fields
  delayRange?: {
    min: number; // seconds
    max: number; // seconds
  };
}

export interface BulkMessageResponse {
  success: boolean;
  jobId: string;
  totalNumbers: number;
  message: string;
  estimatedDuration?: number; // seconds
  error?: string;
}

export interface BulkMessageStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    sent: number;
    failed: number;
    total: number;
    percentage: number;
  };
  results: {
    number: string;
    success: boolean;
    messageId?: string;
    error?: string;
    sentAt?: string;
    personalizedMessage?: string; // Store the actual message sent
  }[];
  startedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
}

export interface SessionStatusResponse {
  sessionId: string;
  status: WhatsAppSession['status'];
  qrCode?: string;
  clientInfo?: WhatsAppSession['clientInfo'];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MediaMessage {
  file: Express.Multer.File;
  caption?: string;
} 