# SuppSensei Server

Backend API server for the SuppSensei React Native app, providing AI-powered supplement recommendations and health goal management.

## Features

- **Gemini AI Integration**: Powered by Google's Gemini API for intelligent supplement recommendations
- **Secure API Key Management**: Environment variables for sensitive data protection
- **Comprehensive Logging**: Winston-based logging system for monitoring and debugging
- **Rate Limiting**: Built-in protection against API abuse
- **CORS Support**: Configured for React Native app communication
- **Security Headers**: Helmet middleware for enhanced security

## API Endpoints

### Test Endpoints
- `GET /` - Health check endpoint
- `POST /test` - Marco/Polo test endpoint
  - Body: `{ "message": "Marco" }`
  - Response: `{ "response": "Polo" }`

### AI Endpoints
- `POST /gemini-test` - Gemini AI test endpoint
  - Body: `{ "prompt": "Your question here" }`
  - Response: `{ "response": "AI response", "fullResponse": {...} }`

## Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Vixolent/suppsensei-server.git
cd suppsensei-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Development

- **Development server**: `npm run dev` (uses nodemon for auto-restart)
- **Production server**: `npm start`
- **Logs**: Check the `logs/` directory for detailed server activity

## Logging

The server uses Winston for comprehensive logging:

- `logs/server.log` - Human-readable logs with timestamps
- `logs/combined.log` - All logs in JSON format
- `logs/error.log` - Error logs only

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet middleware
- **CORS Protection**: Configured for React Native
- **Environment Variables**: Secure API key storage

## Deployment

This server is designed to be deployed on Render.com:

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Winston** - Logging
- **Helmet** - Security middleware
- **Express Rate Limit** - Rate limiting
- **CORS** - Cross-origin resource sharing
- **Google Gemini API** - AI integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details

## Author

Brian Stanton - SuppSensei Development 