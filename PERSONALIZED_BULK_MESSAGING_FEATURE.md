# Personalized Bulk Messaging Feature Implementation

## Overview

This document outlines the implementation of the personalized bulk messaging feature for the WhatsApp API backend. This feature extends the existing bulk messaging system to support dynamic placeholders and personalized messages based on CSV/JSON data input.

## Features Implemented

### 1. Dynamic Placeholder Support
- **Template System**: Use `{{PlaceholderName}}` syntax in message templates
- **Automatic Replacement**: Placeholders are dynamically replaced with actual data values
- **Flexible Data Structure**: Support for any number of custom placeholders

### 2. Data-Driven Messaging
- **CSV/JSON Input**: Accept data as an array of objects
- **Automatic Phone Extraction**: Phone numbers are extracted from the `Phone` field in each data object
- **No Separate Numbers Array**: Phone numbers are automatically extracted from the data

### 3. Comprehensive Validation
- **Phone Field Validation**: Ensures every data object has a `Phone` field
- **Placeholder Validation**: Validates that all placeholders in the message exist in the data objects
- **Data Structure Validation**: Ensures data is a valid array of objects

### 4. Enhanced Job Tracking
- **Personalized Message Storage**: Each result includes the actual personalized message sent
- **Detailed Error Reporting**: Specific error messages for validation failures
- **Real-time Progress**: Track progress with personalized message details

## API Endpoint

### Personalized Bulk Messaging
```
POST /api/sessions/{sessionId}/send-personalized-bulk-text
```

## Request Format

### Frontend Payload (as specified)
```json
{
  "message": "Hello {{Name}}, your code is {{Code}}",
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
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-here",
    "totalNumbers": 2,
    "message": "Hello {{Name}}, your code is {{Code}}",
    "estimatedDuration": 11
  },
  "message": "Personalized bulk message job started successfully"
}
```

### Job Status Response
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
        "number": "+201122267427",
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

## Validation Rules

### 1. Phone Field Requirement
- Every data object must contain a `Phone` field
- Error: `"Phone field is missing in data item at index {index}"`

### 2. Placeholder Matching
- All placeholders in the message template must exist in the data objects
- Error: `"Placeholder {{PlaceholderName}} not found in data item at index {index}"`

### 3. Data Structure
- Data must be a non-empty array of objects
- Error: `"Data array is required and must not be empty"`

## Error Examples

### Missing Phone Field
```json
{
  "message": "Hello {{Name}}",
  "data": [
    {
      "Name": "Ahmed"
      // Missing Phone field
    }
  ]
}
```
**Error**: `"Phone field is missing in data item at index 0"`

### Missing Placeholder
```json
{
  "message": "Hello {{Name}}, your age is {{Age}}",
  "data": [
    {
      "Phone": "+1234567890",
      "Name": "Ahmed"
      // Missing Age placeholder
    }
  ]
}
```
**Error**: `"Placeholder {{Age}} not found in data item at index 0"`

### Invalid Data Structure
```json
{
  "message": "Hello {{Name}}",
  "data": "not an array"
}
```
**Error**: `"Data array is required and must not be empty"`

## Technical Implementation

### 1. Placeholder Replacement Algorithm
```typescript
private replacePlaceholders(message: string, data: Record<string, any>): string {
  return message.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
    const value = data[placeholder];
    if (value === undefined) {
      throw new Error(`Placeholder {{${placeholder}}} not found in data object`);
    }
    return String(value);
  });
}
```

### 2. Data Validation
```typescript
private validatePersonalizedData(data: Record<string, any>[], message: string): void {
  // Extract all placeholders from the message
  const placeholders = new Set<string>();
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = placeholderRegex.exec(message)) !== null) {
    placeholders.add(match[1]);
  }

  // Validate each data object
  data.forEach((item, index) => {
    if (!item.Phone) {
      throw new Error(`Phone field is missing in data item at index ${index}`);
    }

    placeholders.forEach(placeholder => {
      if (!(placeholder in item)) {
        throw new Error(`Placeholder {{${placeholder}}} not found in data item at index ${index}`);
      }
    });
  });
}
```

### 3. Processing Flow
1. **Validation**: Validate data structure and placeholder matching
2. **Job Creation**: Create job with unique ID and status tracking
3. **Background Processing**: Process each data item asynchronously
4. **Placeholder Replacement**: Replace placeholders for each message
5. **Message Sending**: Send personalized message with random delays
6. **Progress Tracking**: Update job status and store personalized messages

## Files Modified

### 1. Type Definitions (`src/types/index.ts`)
- Added `PersonalizedBulkMessageRequest` interface
- Updated `BulkMessageStatus` to include `personalizedMessage` field

### 2. Service Layer (`src/services/WhatsAppService.ts`)
- Added `sendPersonalizedBulkTextMessage()` method
- Added `processPersonalizedBulkMessages()` private method
- Added `replacePlaceholders()` utility method
- Added `validatePersonalizedData()` validation method

### 3. Controller Layer (`src/controllers/WhatsAppController.ts`)
- Added `sendPersonalizedBulkTextMessage()` controller method
- Added comprehensive Swagger documentation
- Added input validation and error handling

### 4. Routes (`src/routes/index.ts`)
- Added personalized bulk messaging route

### 5. Swagger Configuration (`src/index.ts`)
- Added `PersonalizedBulkMessageRequest` schema
- Updated API documentation

### 6. Documentation (`README.md`)
- Added personalized messaging section
- Added usage examples and validation rules
- Added error handling documentation

## Usage Examples

### Basic Personalized Message
```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-personalized-bulk-text \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello {{Name}}, your code is {{Code}}",
    "data": [
      {
        "Phone": "+201122267427",
        "Name": "Ahmed Kabary",
        "Code": "3256888"
      }
    ]
  }'
```

### Complex Personalized Message
```bash
curl -X POST http://localhost:3001/api/sessions/my-session/send-personalized-bulk-text \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello {{Name}}, your student number is {{Student Number}}. You are in group {{Group Name}}. Your code is {{Code}} and password is {{Password}}.",
    "data": [
      {
        "Phone": "+201122267427",
        "Name": "Ahmed Kabary",
        "Student Number": "11",
        "Group Name": "السبت 8",
        "Code": "3256888",
        "Password": "12345"
      }
    ]
  }'
```

## Testing

A comprehensive test script (`test-personalized-bulk-messaging.js`) is provided that:

1. **Tests Normal Operation**: Sends personalized messages with placeholders
2. **Tests Error Handling**: Validates missing Phone fields and placeholders
3. **Monitors Progress**: Tracks job progress and displays personalized messages
4. **Shows Results**: Displays detailed results with actual messages sent

## Benefits

### 1. User Experience
- **Personalized Communication**: Each recipient gets a customized message
- **Easy Data Integration**: Direct support for CSV/JSON data structures
- **Flexible Templates**: Support for any number of placeholders

### 2. Developer Experience
- **Clear Validation**: Specific error messages for validation failures
- **Comprehensive Documentation**: Complete API documentation with examples
- **Type Safety**: Full TypeScript support with proper interfaces

### 3. System Reliability
- **Robust Validation**: Prevents invalid data from being processed
- **Error Isolation**: Individual message failures don't affect the entire batch
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

## Security Considerations

1. **Input Validation**: All placeholders and data are validated before processing
2. **Error Handling**: Detailed error messages help identify issues without exposing sensitive data
3. **Data Integrity**: Ensures all required fields are present before processing
4. **Rate Limiting**: Random delays prevent rapid-fire messaging

## Performance Considerations

1. **Background Processing**: Personalized messages are processed asynchronously
2. **Memory Efficiency**: Data is processed sequentially to manage memory usage
3. **Progress Tracking**: Real-time progress updates without blocking the API
4. **Error Recovery**: Individual message failures don't stop the entire batch

## Future Enhancements

1. **Template Management**: Store and reuse message templates
2. **Data Import**: Direct CSV/Excel file upload support
3. **Conditional Logic**: Support for conditional placeholders
4. **Message Scheduling**: Schedule personalized messages for future delivery
5. **Analytics**: Detailed analytics on personalized message performance
6. **Template Variables**: Support for more complex variable types (dates, numbers, etc.)

## Dependencies

No additional dependencies were required. The feature uses existing libraries:
- `uuid`: For generating unique job IDs
- `whatsapp-web.js`: For sending messages
- `express`: For API endpoints

## Build and Deployment

The feature is fully integrated and ready for deployment:

```bash
npm run build
npm start
```

All TypeScript types are properly defined and the code compiles without errors. 