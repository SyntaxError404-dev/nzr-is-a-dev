# GPT4Free Web Platform (g4f.dev)

## Overview

GPT4Free (g4f.dev) is a client-side web platform that provides free, browser-based access to AI language models without requiring a backend server. The project is now a single-page AI chat interface with a nostalgic aesthetic design featuring gradient colors (purple, pink, blue) and a dark theme.

The platform emphasizes:
- Zero backend dependency - all AI interactions happen client-side
- Multiple AI provider support through a unified JavaScript client
- Nostalgic aesthetic with colorful gradient accents
- Fully responsive design across all devices
- Professional animations and smooth transitions
- Image preview modals and enhanced skeleton loading states
- Premium hamburger menu with slide-out sidebar navigation
- Custom-styled dropdown selects with gradient icons
- Copy-to-clipboard functionality for all code blocks

## Recent Changes (November 5, 2025)

Enhanced the UI/UX with premium, iconic, and professional improvements:
1. **Toast Notifications**: Moved from bottom-right to top-right for better visibility
2. **Skeleton Loading**: Enhanced image generation loading with multi-color gradients, shimmer effects, and centered sparkle icon. Now supports dynamic aspect ratios (square, portrait, landscape, wide, ultrawide) based on actual image dimensions.
3. **Hamburger Menu**: Truly fixed-position menu button in top-left corner that never scrolls with content. Uses position: fixed with !important on top/left values and proper z-index layering (10001).
4. **Welcome Message**: Automatic AI greeting when users first visit, explaining how to use the menu button, choose providers/models, and start chatting. Appears 500ms after page load.
5. **Premium Custom Selects**: Replaced default dropdowns with custom-styled selects featuring:
   - Colorful gradient icons for each provider and model
   - Smooth hover animations with border glow effects
   - Dropdown options with gradient-colored icons
   - Synchronized with hidden native selects for compatibility
   - Properly maintains model type (chat/image) for correct loading indicator
6. **Code Copy Buttons**: Icon-only clipboard button (28px × 28px on desktop, 32px × 32px on mobile) positioned in top-right of code blocks with:
   - Scale animation on hover
   - Visual feedback on copy (checkmark icon)
   - Tooltip for accessibility
   - Fully responsive across all devices
7. **Responsive Design**: All components are fully responsive across mobile, tablet, and desktop devices with proper padding adjustments and overflow handling

## User Preferences

Preferred communication style: Simple, everyday language.

Design preferences:
- Nostalgic aesthetic with gradient colors (purple, pink, blue)
- No emojis in UI (use icons), except sparkle emoji (✨) for AI avatar
- Footer must display "Made with ♥️ by NZ R" in tiny text
- Colorful and premium-looking dropdowns and inputs
- Smooth animations with cubic-bezier transitions

## System Architecture

### Frontend Architecture

**Static Site Structure**
- Pure HTML/CSS/JavaScript implementation with no build process required
- Multiple entry points serving different purposes:
  - `index.html`: Main landing page
  - `chat/`: Interactive chat interfaces
  - `docs/`: Documentation hub
  - `manifest.html`: Project manifesto page
  - `background.html`, `home.html`: Additional demo pages

**Styling Approach**
- Inline CSS with CSS custom properties (variables) for theming
- Consistent color scheme across pages using purple/dark theme (`--accent: #8b3dff`, `--background: #16101b`)
- Responsive design with mobile-first viewport meta tags
- GitHub Primer CSS integration for documentation pages

**Client-Side JavaScript Architecture**
- ES6 modules (`"type": "module"` in package.json)
- Modular script loading with deferred execution
- Key modules include:
  - `providers.js`: Core AI provider integration
  - `client.js`: Main client API
  - `chat.v1.js`: Chat interface logic
  - `framework.js`: Base framework utilities
  - `mcp-client.js`: MCP (Model Context Protocol) client

**NPM Package Design**
- Published as `@gpt4free/g4f.dev`
- Exports TypeScript definitions alongside JavaScript
- Flexible module resolution supporting wildcard imports
- Distribution via `dist/js/` directory

### Third-Party Integrations

**AI Provider System**
- Abstracted provider interface allowing multiple AI backends
- Client-side provider switching without backend infrastructure
- Designed to work with various GPT-4 and GPT-4o compatible APIs

**UI Libraries**
- **Markdown Rendering**: markdown-it.js for message formatting
- **Code Highlighting**: highlight.js with Dracula theme and copy functionality
- **Encryption**: JSEncrypt for client-side encryption capabilities
- **Image Gallery**: PhotoSwipe for image viewing
- **Sanitization**: sanitize-html.js for security

**Font & Icons**
- Google Fonts (Inter) for typography
- Font Awesome (all.min.css) for iconography

### Development & Deployment

**Local Development Server**
- Python HTTP server (`server.py`) for local testing
- Configured to disable caching for development
- Serves on port 5000 with no-cache headers

**SEO & Metadata Strategy**
- Comprehensive Open Graph and Twitter Card meta tags
- Structured data for social media sharing
- Semantic HTML with proper heading hierarchy
- Robots.txt allowing full crawling with sitemap reference

**Asset Organization**
- Static assets in `dist/` directory:
  - `dist/img/`: Favicons and icons
  - `dist/css/`: Stylesheets
  - `dist/js/`: JavaScript modules and TypeScript definitions

## External Dependencies

### JavaScript Libraries (CDN-based)
- **markdown-it**: Markdown parsing and rendering
- **JSEncrypt**: RSA encryption for client-side security
- **highlight.js**: Syntax highlighting for code blocks
- **highlightjs-copy**: Copy-to-clipboard for code snippets
- **PhotoSwipe**: Touch-enabled image gallery
- **sanitize-html**: HTML sanitization for security
- **GitHub Primer CSS**: GitHub-style UI components for documentation

### Development Tools
- **Python 3**: Simple HTTP server for local development
- **npm**: Package management and distribution

### External Services
- **Google Fonts API**: Web font delivery (Inter font family)
- **GitHub**: Version control and package repository
- **GitHub Assets**: CSS framework delivery via githubassets.com

### Browser APIs Utilized
- **ES6 Modules**: Native module system
- **Fetch API**: HTTP requests to AI providers
- **LocalStorage/SessionStorage**: Client-side state persistence (implied by chat functionality)
- **MediaRecorder API**: Voice recording (`recorder.js`)

### Package Distribution
- **NPM Registry**: Package hosting at @gpt4free/g4f.dev
- **GitHub Pages**: Likely deployment target for g4f.dev domain
- **TypeScript Definitions**: Type safety for library consumers