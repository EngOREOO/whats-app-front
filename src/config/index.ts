import dotenv from "dotenv";

dotenv.config();

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map(s => s.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "production",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3001/api",
  corsOrigins,
  sessionPath: process.env.SESSION_PATH || "./sessions",
  maxSessions: parseInt(process.env.MAX_SESSIONS || "10", 10),
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
};

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";

// Ensure required directories exist
import fs from "fs";

if (!fs.existsSync(config.sessionPath)) {
  fs.mkdirSync(config.sessionPath, { recursive: true });
}

if (!fs.existsSync(config.uploadPath)) {
  fs.mkdirSync(config.uploadPath, { recursive: true });
}
