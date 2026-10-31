# RepoMind

AI-Powered Codebase Intelligence Assistant for Hacktoberfest Hack Day Hyderabad 2026.

## Overview

RepoMind is an AI-powered GitHub repository intelligence platform that helps developers understand, explore, debug, and analyze unfamiliar codebases. Users provide a GitHub repository URL, and RepoMind clones the repository, analyzes its source code using Graphify, builds a knowledge graph, and uses Gemma 4 to answer natural-language questions grounded in that graph.

## Technology Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS, Shadcn/UI, Lucide React
- **Backend**: Next.js API routes, Node.js
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemma 4 through the Gemini API (@google/genai)
- **Visualization**: React Flow for interactive knowledge graph visualization
- **Deployment**: Cloudways Node.js hosting

## Features (Planned)

- Repository cloning and validation
- Graphify integration for knowledge graph generation
- Interactive knowledge graph visualization
- AI chat assistant with graph-based retrieval
- Multimodal image analysis (architecture diagrams, error screenshots)
- Chat history management

## Phase 1 Status

Currently in Phase 1: Basic dashboard with:
- Dark developer-focused interface
- Sidebar navigation
- Repository URL input
- Welcome screen with suggested prompts
- Production-ready build

## Getting Started

### Prerequisites

- Node.js 22.x or later
- npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd repomind
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL="file:./dev.db"
DATA_DIR=./data
GITHUB_ALLOWED_HOST=github.com
```

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deployment on Cloudways

### Prerequisites
- Cloudways account with Node.js server
- GitHub repository with this code

### Steps

1. **Create a Node.js Application on Cloudways**
   - Log in to Cloudways
   - Click "Add New Application"
   - Select "Node.js" platform
   - Choose your server and application name
   - Click "Add Application"

2. **Configure Application Settings**
   - Go to Application Settings
   - Set "App Directory" to `/public`
   - Set "Startup File" to `npm start`
   - Set "Node Version" to `22.x`

3. **Set Environment Variables**
   - Go to Application Settings > Environment Variables
   - Add the following:
     ```
     GEMINI_API_KEY=your_gemini_api_key
     DATABASE_URL="file:./dev.db"
     DATA_DIR=/home/repomind/data
     GITHUB_ALLOWED_HOST=github.com
     NODE_ENV=production
     ```

4. **Configure Persistent Storage**
   - Create a data directory for persistent storage:
     - SSH into your Cloudways server
     - Run: `mkdir -p /home/repomind/data`
     - Ensure proper permissions

5. **Deploy from GitHub**
   - Go to Application Settings > Git
   - Select "Clone from GitHub Repository"
   - Enter your repository URL
   - Select branch (usually `main`)
   - Click "Clone Repository"

6. **Build the Application**
   - SSH into your server
   - Navigate to the application directory
   - Run:
     ```bash
     npm install --production
     npm run build
     ```

7. **Restart the Application**
   - In Cloudways dashboard, click "Restart" for your application
   - Or restart via SSH: `pm2 restart all`

8. **Access Your Application**
   - Use the domain provided by Cloudways
   - Or configure a custom domain in Application Settings

### Important Notes

- Cloudways temporary directories are not persistent. Always use `/home/repomind/data` or another persistent location for SQLite database and cloned repositories.
- Ensure Python and Graphify are installed on the server before Phase 2 deployment.
- Monitor application logs in Cloudways dashboard for any errors.

## License

MIT License - see LICENSE file for details.

## Hackathon Information

Built for Hacktoberfest Hack Day Hyderabad 2026.
