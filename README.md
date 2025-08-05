# WhatsApp API Backend

A robust, scalable WhatsApp messaging API built with TypeScript, Express, and whatsapp-web.js.

## Features

- 🔄 Multi-session support (multiple WhatsApp accounts)
- 📱 QR Code authentication
- 💬 Send text and media messages
- 📤 **Bulk messaging with random delays** (NEW!)
- 🎯 **Personalized bulk messaging with dynamic placeholders** (NEW!)
- 📊 Session management and status monitoring
- 📚 Complete API documentation with Swagger
- 🔒 File upload validation and security
- 🏗️ Modular, scalable architecture
- 📝 TypeScript for type safety

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Access the API:**
   - API Base: http://localhost:3001/api
   - Documentation: http://localhost:3001/api-docs
   - Health Check: http://localhost:3001/api/health

## API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session status
- `POST /api/sessions/:id/logout` - Logout session
- `DELETE /api/sessions/:id` - Delete session

### Messages

- `POST /api/sessions/:id/send-text` - Send text message
- `POST /api/sessions/:id/send-media` - Send media message

### Bulk Messages

- `POST /api/sessions/:id/send-bulk-text` - Send bulk text messages with random delays
- `POST /api/sessions/:id/send-personalized-bulk-text` - Send personalized bulk messages with placeholders
- `GET /api/bulk-jobs` - List all bulk message jobs
- `GET /api/bulk-jobs/:jobId` - Get bulk message job status

### System

- `GET /api/health` - Health check

## Environment Variables

| Variable        | Description                 | Default               |
| --------------- | --------------------------- | --------------------- |
| `PORT`          | Server port                 | 3001                  |
| `NODE_ENV`      | Environment                 | development           |
| `CORS_ORIGIN`   | CORS origin                 | http://localhost:3000 |
| `SESSION_PATH`  | Session storage path        | ./sessions            |
| `MAX_SESSIONS`  | Maximum concurrent sessions | 10                    |
| `UPLOAD_PATH`   | File upload path            | ./uploads             |
| `MAX_FILE_SIZE` | Max file size in bytes      | 10485760 (10MB)       |

## Usage Examples

### Create a Session

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "my-session"}'
```

### Send Text Message

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "1234567890",
    "message": "Hello from WhatsApp API!"
  }'
```

### Send Media Message

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-media \
  -F "to=1234567890" \
  -F "caption=Check this image!" \
  -F "file=@/path/to/image.jpg"
```

### Send Bulk Messages

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-bulk-text \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": ["1234567890", "0987654321", "5555555555"],
    "message": "Hello from bulk messaging!",
    "delayRange": {
      "min": 2,
      "max": 9
    }
  }'
```

### Send Personalized Bulk Messages (NEW!)

```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-personalized-bulk-text \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello {{Name}}, your code is {{Code}}. You are in group {{Group Name}}.",
    "data": [
      {
        "Phone": "+201122267427",
        "Name": "Ahmed Kabary",
        "Student Number": "11",
        "Group Name": "السبت 8",
        "Code": "3256888",
        "Password": "12345"
      },
      {
        "Phone": "+201061370451",
        "Name": "Sarah Johnson",
        "Student Number": "12",
        "Group Name": "الأحد 9",
        "Code": "3256889",
        "Password": "67890"
      }
    ],
    "delayRange": {
      "min": 2,
      "max": 9
    }
  }'
```

### Check Bulk Job Status

```bash
curl -X GET http://localhost:3001/api/bulk-jobs/YOUR_JOB_ID
```

### List All Bulk Jobs

```bash
curl -X GET http://localhost:3001/api/bulk-jobs
```

## Bulk Messaging Features

The bulk messaging feature includes:

- **Random Delays**: Configurable delay range (2-9 seconds by default) between messages to avoid detection
- **Job Tracking**: Each bulk operation gets a unique job ID for monitoring progress
- **Real-time Progress**: Track sent, failed, and total messages with percentage completion
- **Detailed Results**: Individual results for each phone number including success/failure status
- **Background Processing**: Messages are sent in the background, allowing you to monitor progress via API
- **Anti-Detection**: Random delays help prevent your WhatsApp account from being flagged or banned

## Personalized Bulk Messaging Features (NEW!)

The personalized bulk messaging feature includes all the above features plus:

- **Dynamic Placeholders**: Use `{{PlaceholderName}}` syntax in your message template
- **CSV/JSON Data Support**: Send data as an array of objects with Phone and placeholder values
- **Automatic Phone Extraction**: Phone numbers are automatically extracted from the data array
- **Comprehensive Validation**: Validates that all placeholders exist in the data and Phone fields are present
- **Personalized Message Storage**: Each result includes the actual personalized message that was sent
- **Error Handling**: Detailed error messages for missing placeholders or Phone fields

### Placeholder Syntax

Use double curly braces to define placeholders in your message template:

```
Hello {{Name}}, your code is {{Code}}. You are in group {{Group Name}}.
```

### Data Format

Each data object must contain:
- **Phone**: The recipient's phone number (required)
- **Any other fields**: Values for placeholders used in the message template

### Validation Rules

The system validates:
1. **Phone Field**: Every data object must have a `Phone` field
2. **Placeholder Matching**: All placeholders in the message must exist in the data objects
3. **Data Structure**: Data must be a non-empty array of objects

### Error Examples

**Missing Phone field:**
```json
{
  "message": "Hello {{Name}}",
  "data": [
    {
      "Name": "Ahmed"
      // Missing Phone field - will cause error
    }
  ]
}
```

**Missing placeholder:**
```json
{
  "message": "Hello {{Name}}, your age is {{Age}}",
  "data": [
    {
      "Phone": "+1234567890",
      "Name": "Ahmed"
      // Missing Age placeholder - will cause error
    }
  ]
}
```

## Bulk Message Request Format

### Standard Bulk Messaging
```json
{
  "numbers": ["1234567890", "0987654321"],
  "message": "Your message here",
  "delayRange": {
    "min": 2,
    "max": 9
  }
}
```

### Personalized Bulk Messaging
```json
{
  "message": "Hello {{Name}}, your code is {{Code}}",
  "data": [
    {
      "Phone": "+201122267427",
      "Name": "Ahmed Kabary",
      "Code": "3256888"
    },
    {
      "Phone": "+201061370451",
      "Name": "Sarah Johnson",
      "Code": "3256889"
    }
  ],
  "delayRange": {
    "min": 2,
    "max": 9
  }
}
```

## Bulk Message Response

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-here",
    "totalNumbers": 2,
    "message": "Your message here",
    "estimatedDuration": 11
  },
  "message": "Bulk message job started successfully"
}
```

## Job Status Response

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-here",
    "status": "running",
    "progress": {
      "sent": 1,
      "failed": 0,
      "total": 2,
      "percentage": 50
    },
    "results": [
      {
        "number": "1234567890",
        "success": true,
        "messageId": "message-id-here",
        "sentAt": "2024-01-01T12:00:00.000Z",
        "personalizedMessage": "Hello Ahmed Kabary, your code is 3256888"
      }
    ],
    "startedAt": "2024-01-01T12:00:00.000Z",
    "estimatedCompletion": "2024-01-01T12:00:11.000Z"
  }
}
```

## Testing

Two test scripts are provided to demonstrate the functionality:

### Standard Bulk Messaging Test
```bash
node test-bulk-messaging.js
```

### Personalized Bulk Messaging Test
```bash
node test-personalized-bulk-messaging.js
```

## Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Express middlewares
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Type checking without compilation

## Production Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start production server:**

   ```bash
   npm start
   ```

3. **Using PM2 (recommended):**
   ```bash
   pm2 start dist/index.js --name whatsapp-api
   ```

## Security Considerations

- File uploads are validated for type and size
- CORS is configured for specific origins
- Input validation on all endpoints
- Error handling prevents information leakage
- Session isolation between users
- **Bulk messaging includes random delays to prevent detection**
- **Personalized messaging validates all placeholders and data integrity**

## Troubleshooting

### Common Issues

1. **Puppeteer issues:**

   - Install missing dependencies: `apt-get install -y chromium-browser`
   - Use provided Puppeteer args for headless mode

2. **Permission errors:**

   - Check file permissions for session and upload directories
   - Ensure proper write access

3. **Memory issues:**
   - Monitor session count and cleanup inactive sessions
   - Consider implementing session timeout

4. **Bulk messaging issues:**
   - Ensure session is in "ready" state before starting bulk operations
   - Monitor job status to track progress and identify failed messages
   - Adjust delay range if experiencing rate limiting

5. **Personalized messaging issues:**
   - Ensure all placeholders in the message template exist in the data objects
   - Verify that every data object has a `Phone` field
   - Check that data is a valid array of objects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
#   w h a t s - a p p - f r o n t  
 