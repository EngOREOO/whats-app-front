import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types";

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Handle Multer errors
  if (err.message?.includes("File too large")) {
    statusCode = 413;
    message = "File too large";
  }

  if (err.message?.includes("not allowed")) {
    statusCode = 415;
    message = err.message;
  }

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  res.status(statusCode).json(response);
};

export const notFound = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(response);
};
