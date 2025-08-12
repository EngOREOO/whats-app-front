import express from 'express';
import cors, { CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config, isDevelopment, isProduction } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Trust proxy when behind Nginx (ensures correct IP/proto for cookies/sessions)
app.set('trust proxy', 1);

// Constants for binding
const HOST = '127.0.0.1';
const PORT = 5000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp API',
      version: '1.0.0',
      description: 'A robust WhatsApp messaging API built with whatsapp-web.js',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: config.apiBaseUrl,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            data: {
              type: 'object',
              description: 'Response data (when successful)'
            },
            error: {
              type: 'string',
              description: 'Error message (when unsuccessful)'
            },
            message: {
              type: 'string',
              description: 'Additional message'
            }
          }
        },
        WhatsAppSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique session identifier'
            },
            status: {
              type: 'string',
              enum: ['initializing', 'qr', 'authenticated', 'ready', 'disconnected'],
              description: 'Current session status'
            },
            qrCode: {
              type: 'string',
              description: 'QR code string (when status is qr)'
            },
            clientInfo: {
              type: 'object',
              properties: {
                pushname: {
                  type: 'string',
                  description: 'WhatsApp display name'
                },
                wid: {
                  type: 'string',
                  description: 'WhatsApp ID'
                },
                platform: {
                  type: 'string',
                  description: 'WhatsApp platform'
                }
              }
            }
          }
        },
        BulkMessageRequest: {
          type: 'object',
          required: ['numbers', 'message'],
          properties: {
            numbers: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of phone numbers to send messages to',
              example: ['1234567890', '0987654321']
            },
            message: {
              type: 'string',
              description: 'Text message to send to all numbers'
            },
            delayRange: {
              type: 'object',
              properties: {
                min: {
                  type: 'number',
                  description: 'Minimum delay in seconds between messages',
                  default: 2
                },
                max: {
                  type: 'number',
                  description: 'Maximum delay in seconds between messages',
                  default: 9
                }
              }
            }
          }
        },
        PersonalizedBulkMessageRequest: {
          type: 'object',
          required: ['message', 'data'],
          properties: {
            message: {
              type: 'string',
              description: 'Message template with placeholders (e.g., "Hello {{Name}}, your code is {{Code}}")',
              example: 'Hello {{Name}}, your code is {{Code}}'
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                required: ['Phone'],
                properties: {
                  Phone: {
                    type: 'string',
                    description: 'Phone number for the recipient',
                    example: '+201122267427'
                  },
                  Name: {
                    type: 'string',
                    description: 'Name placeholder value',
                    example: 'Ahmed Kabary'
                  },
                  Code: {
                    type: 'string',
                    description: 'Code placeholder value',
                    example: '3256888'
                  }
                }
              },
              description: 'Array of data objects containing Phone and placeholder values',
              example: [
                {
                  'Phone': '+201122267427',
                  'Name': 'Ahmed Kabary',
                  'Code': '3256888'
                },
                {
                  'Phone': '+201061370451',
                  'Name': 'Sarah Johnson',
                  'Code': '3256889'
                }
              ]
            },
            delayRange: {
              type: 'object',
              properties: {
                min: {
                  type: 'number',
                  description: 'Minimum delay in seconds between messages',
                  default: 2
                },
                max: {
                  type: 'number',
                  description: 'Maximum delay in seconds between messages',
                  default: 9
                }
              }
            }
          }
        },
        BulkMessageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the bulk message job was started successfully'
            },
            jobId: {
              type: 'string',
              description: 'Unique job identifier for tracking progress'
            },
            totalNumbers: {
              type: 'number',
              description: 'Total number of phone numbers to send messages to'
            },
            message: {
              type: 'string',
              description: 'The message that will be sent to all numbers'
            },
            estimatedDuration: {
              type: 'number',
              description: 'Estimated duration in seconds for the bulk operation'
            },
            error: {
              type: 'string',
              description: 'Error message (when unsuccessful)'
            }
          }
        },
        BulkMessageStatus: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'Unique job identifier'
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed'],
              description: 'Current job status'
            },
            progress: {
              type: 'object',
              properties: {
                sent: {
                  type: 'number',
                  description: 'Number of messages sent successfully'
                },
                failed: {
                  type: 'number',
                  description: 'Number of messages that failed to send'
                },
                total: {
                  type: 'number',
                  description: 'Total number of messages to send'
                },
                percentage: {
                  type: 'number',
                  description: 'Progress percentage (0-100)'
                }
              }
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  number: {
                    type: 'string',
                    description: 'Phone number'
                  },
                  success: {
                    type: 'boolean',
                    description: 'Whether the message was sent successfully'
                  },
                  messageId: {
                    type: 'string',
                    description: 'WhatsApp message ID (when successful)'
                  },
                  error: {
                    type: 'string',
                    description: 'Error message (when failed)'
                  },
                  sentAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Timestamp when the message was sent'
                  },
                  personalizedMessage: {
                    type: 'string',
                    description: 'The actual personalized message that was sent'
                  }
                }
              }
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the job started'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the job completed'
            },
            estimatedCompletion: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated completion time'
            }
          }
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const PROD_ORIGINS = ['https://api.codiaumtech.com'];
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., curl, Postman) which have no origin
    if (!origin) return callback(null, true);

    const allowed = isProduction ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Liveness/Readiness health check
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WhatsApp API Documentation'
}));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp API Server',
    version: '1.0.0',
    documentation: `${config.apiBaseUrl.replace('/api', '')}/api-docs`,
    endpoints: {
      health: '/api/health',
      healthz: '/healthz',
      sessions: '/api/sessions',
      bulkJobs: '/api/bulk-jobs',
      documentation: '/api-docs'
    }
  });
});

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server (bind explicitly to 127.0.0.1:5000)
const server = app.listen(PORT, HOST, () => {
  logger.info('Backend running on http://127.0.0.1:5000');
  // Keep informative logs for local dev
  if (isDevelopment) {
    logger.info(`📚 API Documentation: http://127.0.0.1:${PORT}/api-docs`);
    logger.info(`🏥 Health Check: http://127.0.0.1:${PORT}/api/health`);
    logger.info(`🩺 Liveness: http://127.0.0.1:${PORT}/healthz`);
  }
});

export default app; 