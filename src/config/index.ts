import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3001/api",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
