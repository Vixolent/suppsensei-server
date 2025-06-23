const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'suppsensei-server' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
    // Write all logs to server.log for easy viewing
    new winston.transports.File({ 
      filename: path.join(logsDir, 'server.log'),
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const app = express();
const port = process.env.PORT || 3000;

// Debug: Log environment variables
logger.info('Environment variables loaded:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
  GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
});

// Gemini API configuration from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Add validation
if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Enable CORS for React Native app
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    headers: req.headers
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });

  next();
});

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.send('Hello, world!!!!!!!!!!!!!!!!!!!!!!!');
});

// Test endpoint for Marco/Polo
app.post('/test', (req, res) => {
  const { message } = req.body;
  
  logger.info('Test endpoint called', { message });
  
  if (message === 'Marco') {
    logger.info('Marco received, sending Polo');
    res.json({ response: 'Polo' });
  } else {
    logger.info('Non-Marco message received', { message });
    res.json({ response: 'Try sending "Marco"' });
  }
});

// Gemini API test endpoint
app.post('/gemini-test', async (req, res) => {
  const { prompt } = req.body;
  
  logger.info('Gemini API test endpoint called', { prompt });
  
  if (!prompt) {
    logger.warn('Gemini test called without prompt');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    logger.info('Making request to Gemini API', { 
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length 
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    logger.info('Gemini API response received', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response text from Gemini
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    
    logger.info('Gemini API successful', {
      responseLength: geminiResponse.length,
      responsePreview: geminiResponse.substring(0, 100) + (geminiResponse.length > 100 ? '...' : ''),
      fullResponseKeys: Object.keys(data)
    });
    
    res.json({ 
      response: geminiResponse,
      fullResponse: data // Include full response for debugging
    });
    
  } catch (error) {
    logger.error('Gemini API error', {
      error: error.message,
      stack: error.stack,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
    });
    
    res.status(500).json({ 
      error: 'Failed to get response from Gemini API',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

app.listen(port, () => {
  logger.info('Server started successfully', {
    port: port,
    environment: process.env.NODE_ENV,
    availableEndpoints: ['POST /test', 'POST /gemini-test', 'GET /']
  });
  
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- POST /test (Marco/Polo test)');
  console.log('- POST /gemini-test (Gemini API test)');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Logs are being written to the logs/ directory');
});
