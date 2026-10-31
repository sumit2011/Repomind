# Project: RepoMind – AI-Powered Codebase Intelligence Assistant

Act as a senior full-stack engineer and AI architect. Build a production-quality hackathon project called **RepoMind** for Hacktoberfest Hack Day Hyderabad 2026.

## 1. Project Overview

RepoMind is an AI-powered GitHub repository intelligence platform that helps developers understand, explore, debug, and analyze unfamiliar codebases.

Users provide a GitHub repository URL. RepoMind clones the repository, analyzes its source code using Graphify, builds a knowledge graph, and uses Gemma 4 to answer natural-language questions grounded in that graph.

The platform must also support image uploads so developers can submit architecture diagrams, screenshots of errors, and code-related images for multimodal analysis.

## 2. Technology Stack

Frontend:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Lucide React

Backend:
- Next.js API routes
- Node.js
- simple-git for GitHub cloning
- Python Graphify CLI for knowledge graph generation

Database:
- SQLite
- Prisma ORM

AI:
- Google Gemma 4 through the Gemini API
- Official Google Gen AI SDK: @google/genai

Visualization:
- React Flow for interactive knowledge graph visualization

Deployment:
- Cloudways Node.js hosting / Velocity
- GitHub integration

## 3. Main Features

### A. Repository Management
- Accept public GitHub repository URLs.
- Validate repository URLs.
- Clone repositories using simple-git.
- Generate unique repository IDs.
- Display repository name, branch, language, and indexing status.
- Handle invalid URLs and cloning errors.
- Restrict repository size and prevent unsafe repository access.

### B. Graphify Integration
- Execute Graphify against cloned repositories.
- Generate knowledge graph data.
- Extract files, classes, functions, dependencies, and relationships.
- Store graph data and repository metadata.
- Display indexing progress:
  1. Repository validation.
  2. Cloning repository.
  3. Building knowledge graph.
  4. Processing graph.
  5. Ready.

### C. Interactive Knowledge Graph
- Visualize repository relationships using React Flow.
- Represent files, functions, classes, and modules as nodes.
- Represent dependencies and relationships as edges.
- Support zooming, panning, searching, and node selection.
- Show node details when clicked.

### D. AI Chat Assistant
Create a conversational assistant powered by Gemma 4.

Users should be able to ask:
- Where is authentication handled?
- Explain the project architecture.
- Which files depend on this module?
- Explain the execution flow.
- Where is the database connection configured?
- Identify tightly coupled components.
- Explain a particular function.

Implement graph-based retrieval:
- Extract relevant graph nodes based on the user query.
- Retrieve relevant relationships and source-file references.
- Send only relevant context to Gemma 4.
- Avoid sending the complete graph to the model.

The assistant must:
- Ground answers in retrieved repository context.
- Cite specific files and relevant code locations when available.
- Never invent files or functions.
- Clearly state when the graph does not contain enough information.

### E. Multimodal AI Analysis
Implement image uploads in the chat interface.

Users should be able to:
- Upload architecture diagrams.
- Upload screenshots of compiler errors.
- Upload screenshots of exceptions.
- Ask questions about uploaded images.

Send both the image and relevant repository graph context to Gemma 4.

Example:
"Does my current codebase architecture match this uploaded architecture diagram?"

Another example:
"Analyze this error screenshot and identify which files in my repository might be responsible."

### F. Chat History
- Create new conversations.
- Store conversation history in SQLite.
- Associate conversations with repositories.
- Display previous conversations in the sidebar.
- Allow users to rename and delete conversations.

## 4. UI/UX Requirements

Create a polished, modern developer dashboard.

Design direction:
- Dark developer-focused interface.
- Background: near-black.
- Primary accent: blue.
- Secondary accent: purple.
- Subtle borders.
- Rounded cards.
- Clean typography.
- Responsive layout.

Main layout:

Sidebar:
- RepoMind logo.
- New conversation button.
- Connected repositories.
- Recent conversations.
- Knowledge graph.
- Settings.
- Documentation.

Top navigation:
- Repository URL input.
- Connect repository button.
- Repository indexing status.

Main content:
- AI welcome screen.
- Suggested prompts.
- Chat conversation.
- Markdown-rendered AI responses.
- Source-file citations.
- Image upload dropzone.
- Message composer.

Knowledge graph page:
- Interactive React Flow canvas.
- Search and filter.
- Node details panel.
- Relationship visualization.

Use reusable components and maintain consistent design.

## 5. Backend API Structure

Implement these endpoints:

POST /api/repositories
- Validate GitHub URL.
- Clone repository.
- Create indexing job.
- Return repository ID.

GET /api/repositories/[id]/status
- Return indexing status and progress.

GET /api/repositories/[id]
- Return repository information.

GET /api/repositories/[id]/graph
- Return knowledge graph.

POST /api/chat
- Accept repository ID, conversation ID, query, and optional image.
- Retrieve relevant graph context.
- Call Gemma 4.
- Return grounded response with citations.

POST /api/upload
- Validate and process image uploads.

GET /api/conversations
- Return chat history.

POST /api/conversations
- Create a conversation.

DELETE /api/conversations/[id]
- Delete a conversation.

## 6. Database Design

Create SQLite models for:

Repository:
- id
- name
- githubUrl
- branch
- localPath
- graphPath
- indexingStatus
- createdAt
- updatedAt

Conversation:
- id
- repositoryId
- title
- createdAt
- updatedAt

Message:
- id
- conversationId
- role
- content
- citations
- createdAt

IndexingJob:
- id
- repositoryId
- status
- progress
- error
- createdAt
- updatedAt

## 7. Security and Reliability

- Store API keys in environment variables.
- Never expose Gemini API keys in frontend code.
- Validate all API requests.
- Validate uploaded file MIME types and sizes.
- Prevent path traversal.
- Restrict GitHub cloning to trusted public GitHub URLs.
- Never execute scripts from cloned repositories.
- Use safe subprocess argument handling.
- Implement API error handling.
- Keep cloned repositories and SQLite data in persistent storage.
- Add cleanup policies for temporary files.
- Avoid exposing internal server paths.

## 8. Deployment Requirements

The application must be deployable on Cloudways.

Requirements:
- Production build using npm run build.
- Start using npm run start.
- Configure Node.js version.
- Configure environment variables.
- Connect GitHub repository.
- Use persistent storage for SQLite and cloned repositories.
- Verify Python and Graphify availability before relying on them.
- Document deployment instructions.

Do not assume temporary deployment directories are persistent.

## 9. Environment Variables

Create a .env.example file:

GEMINI_API_KEY=
DATABASE_URL="file:./dev.db"
DATA_DIR=
GITHUB_ALLOWED_HOST=github.com

Never commit actual API keys.

## 10. Open Source Requirements

Create:
- README.md
- MIT LICENSE
- .env.example
- .gitignore
- Architecture documentation
- Local installation instructions
- Cloudways deployment instructions

Document Graphify and Gemma 4 integration clearly.

## 11. Development Strategy

Build the project incrementally.

Phase 1:
- Create Next.js application.
- Configure Tailwind and Shadcn/UI.
- Build dashboard.
- Verify local production build.
- Push to GitHub.
- Deploy a working application to Cloudways.

Phase 2:
- Implement repository cloning.
- Integrate Graphify.
- Store graph data.
- Implement indexing status.

Phase 3:
- Implement graph-based retrieval.
- Integrate Gemma 4.
- Build chat API.
- Add file citations.

Phase 4:
- Implement image uploads.
- Integrate multimodal Gemma 4.
- Compare architecture diagrams with repository graphs.

Phase 5:
- Implement interactive graph visualization.
- Add chat history.
- Add error handling.
- Improve UI.

Phase 6:
- Complete README and documentation.
- Add demo repositories.
- Test production deployment.
- Prepare hackathon demonstration.

## 12. Critical Instructions

1. Do not generate the entire application in one step.
2. Start with Phase 1 only.
3. Generate complete working source code, not pseudocode.
4. Provide exact terminal commands for Kali Linux.
5. Explain which files to create and where to put them.
6. Test TypeScript and production builds.
7. Fix errors before moving to the next phase.
8. Keep the architecture simple enough to finish within the hackathon timeline.
9. Prioritize a working Cloudways deployment over unnecessary features.
10. Do not claim an integration works until it has actually been tested.

**First task: Inspect the current project directory and environment. Then implement Phase 1 and guide me through deploying RepoMind to Cloudways.**