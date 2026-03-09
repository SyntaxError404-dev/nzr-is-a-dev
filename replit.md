# Multi-Server Portfolio Project

## Overview

This is a comprehensive Node.js/Express portfolio website hosting multiple sub-projects and applications. The entire project runs purely on Node.js with Express, making it easy to deploy on any hosting platform that supports Node.js.

**Last Updated:** November 5, 2025

## Project Structure

```
.
├── server.js                 # Main Express server (PORT 5000)
├── package.json             # Node.js dependencies
├── PORTFOLIO/               # Main portfolio website (/)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── chat-bot/                # AI Chatbot interface (/chat-bots)
│   └── index.html
├── code-formating-pro/      # Code formatting tool (/code-formating-pro)
│   ├── index.html
│   ├── main.899ce0bf.js
│   └── main.9b8f778d.css
└── Love/                    # Tic-Tac-Toe game (/tic-tac-toe)
    └── index.html
```

## Technology Stack

- **Backend:** Node.js with Express
- **Dependencies:**
  - `express` - Web server framework
  - `axios` - HTTP client for API calls
  - `nodemon` - Development auto-reload

## Available Routes

1. **Portfolio** - `http://localhost:5000/`
   - Main landing page with cyberpunk aesthetic
   - Showcases all projects

2. **Chat Bots** - `http://localhost:5000/chat-bots`
   - GPT4Free web platform
   - Client-side AI chat interface
   - Nostalgic gradient design

3. **Code Formatting Pro** - `http://localhost:5000/code-formating-pro`
   - Code formatting and beautification tool

4. **Tic-Tac-Toe** - `http://localhost:5000/tic-tac-toe`
   - Classic game implementation

5. **Video Generator API** - `http://localhost:5000/gen-vid?prompt=Your+Prompt`
   - Generates videos from text prompts
   - Uses external Renderonix API

## Running the Project

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 5000 and bind to 0.0.0.0, making it accessible from any network interface.

## Deployment

This project is ready to deploy on any hosting platform:

### Hosting Requirements
- Node.js support (v14 or higher recommended)
- Port configuration (default: 5000)
- npm/yarn package manager

### Compatible Platforms
- ✅ Replit
- ✅ Heroku
- ✅ Vercel
- ✅ Railway
- ✅ Render
- ✅ DigitalOcean App Platform
- ✅ AWS Elastic Beanstalk
- ✅ Google Cloud Platform
- ✅ Azure App Service
- ✅ Any VPS with Node.js

### Environment Variables
No environment variables are required for basic functionality. All configurations are self-contained.

## Features

### Server Configuration
- **No-Cache Headers:** Ensures fresh content delivery
- **Static File Serving:** Efficient serving of all sub-projects
- **Video Generation:** Dynamic video creation from text prompts
- **Error Handling:** Proper HTTP error responses
- **CORS Ready:** Can be easily configured for cross-origin requests

### Security
- No exposed secrets or API keys in code
- Proper error handling
- Safe file operations

## Recent Changes

**November 5, 2025:**
- ✅ Removed Python server.py dependency
- ✅ Converted to 100% Node.js/Express
- ✅ Updated package.json to reference correct server file
- ✅ Added .gitignore rules for generated files
- ✅ Configured workflow for automatic server startup
- ✅ Optimized for universal hosting platform compatibility

## Architecture Notes

- **Single Server Design:** One Express server handles all routes
- **Modular Structure:** Each sub-project in its own directory
- **Static File Optimization:** Express.static middleware for performance
- **RESTful API:** Clean URL structure for all endpoints
- **No Database Required:** Fully stateless design

## User Preferences

- Pure Node.js implementation (no Python or other languages)
- Deploy anywhere capability
- Clean, organized file structure
- Production-ready configuration
