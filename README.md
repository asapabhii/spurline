# Spurline AI Support Agent

A production-grade AI customer support agent built with real-time streaming, persistent conversation history, and a clean, extensible architecture. Features WebSocket-based streaming responses, intelligent follow-up suggestions, and graceful degradation for production reliability.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Architecture Overview](#architecture-overview)
- [LLM Integration](#llm-integration)
- [API Reference](#api-reference)
- [Trade-offs & Design Decisions](#trade-offs--design-decisions)
- [If I Had More Time](#if-i-had-more-time)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn**
- **Hugging Face account** (free tier works)
- **Redis** (optional, for production rate limiting)

### Installation

```bash
# Clone repository
git clone https://github.com/asapabhii/spurline.git
cd spurline

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Local Development

### Step 1: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env  # If .env.example exists, or create manually
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_PATH=./data/spurline.db

# Hugging Face API (Required)
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Frontend URL (for CORS in production)
FRONTEND_URL=http://localhost:5173

# Redis (Optional - app works without it)
REDIS_URL=redis://localhost:6379
```

**Getting your Hugging Face API Token:**
1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with **read** access
4. Copy the token (starts with `hf_`) into your `.env` file

### Step 2: Set Up Database

Run migrations to create the database schema:

```bash
cd backend
npm run migrate
```

This will:
- Create the SQLite database file at `./data/spurline.db`
- Create `conversations` and `messages` tables
- Set up foreign key constraints and indexes

**Optional:** Seed sample data for testing:

```bash
npm run seed
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 4: Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   # Expected: {"status":"ok","timestamp":"..."}
   ```

2. **Backend Readiness Check:**
   ```bash
   curl http://localhost:3001/health/ready
   # Expected: {"status":"ready","checks":{"database":"ok","redis":"ok|optional"}}
   ```

3. **Open the Application:**
   - Navigate to [http://localhost:5173](http://localhost:5173)
   - The chat widget should appear
   - Send a test message to verify end-to-end flow

---

## Database Setup

### Migrations

The database schema is managed through migration scripts in `backend/src/db/migrations/`.

**Run migrations:**
```bash
cd backend
npm run migrate
```

**What migrations do:**
- Create `conversations` table (stores conversation metadata)
- Create `messages` table (stores user and AI messages)
- Set up foreign key relationships
- Create indexes for performance

**Migration files:**
- `001_initial.ts` - Initial schema setup

### Database Schema

```sql
-- Conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  channel TEXT DEFAULT 'web',
  metadata TEXT  -- JSON metadata
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

### Seeding (Optional)

Seed scripts populate the database with sample data for testing:

```bash
cd backend
npm run seed
```

**Note:** Seeding is optional and mainly useful for local development and testing.

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode: `development`, `production`, or `test` |
| `PORT` | No | `3001` | Server port number |
| `DATABASE_PATH` | No | `./data/spurline.db` | Path to SQLite database file |
| `HUGGINGFACE_API_TOKEN` | **Yes** | - | Hugging Face API token (starts with `hf_`) |
| `FRONTEND_URL` | No | - | Frontend URL for CORS (required in production) |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string (optional) |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUBLIC_BACKEND_URL` | No | `http://localhost:3001` | Backend API URL (for production) |

**Note:** In SvelteKit, environment variables prefixed with `PUBLIC_` are exposed to the browser. Use `$env/dynamic/public` to access them.

### Environment Validation

The backend uses **Zod** for environment variable validation. Invalid configurations will cause the server to exit with a clear error message.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SvelteKit)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Components  │→ │    Stores    │→ │   API Client     │  │
│  │  (Svelte)    │  │  (Svelte)    │  │   (REST)         │  │
│  └──────────────┘  └──────────────┘  └─────────┬──────────┘  │
│                                                 │             │
│  ┌─────────────────────────────────────────────┼──────────┐  │
│  │         WebSocket Client (Socket.IO)         │          │  │
│  └─────────────────────────────────────────────┼──────────┘  │
└─────────────────────────────────────────────────┼──────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │                               │
                                    ▼                               ▼
                    ┌──────────────────────────┐    ┌──────────────────────┐
                    │   REST API (Express)     │    │  WebSocket (Socket.IO)│
                    └──────────────┬───────────┘    └──────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │   Controllers       │        │   Socket Service      │
        │   (Request/Response)│        │   (Real-time Events)  │
        └──────────┬──────────┘        └──────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │   Services Layer    │
        │  - Chat Service     │
        │  - LLM Service      │
        └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ Repositories │      │  External APIs   │
│  (SQLite)    │      │  (Hugging Face)  │
└──────────────┘      └──────────────────┘
```

### Backend Structure

The backend follows a **layered architecture** with clear separation of concerns:

```
backend/src/
├── config/          # Configuration (env, database, redis)
├── controllers/     # Request handlers (HTTP/WS)
├── services/        # Business logic (chat orchestration, LLM)
├── repositories/    # Data access layer (SQLite queries)
├── routes/          # Route definitions
├── middleware/      # Express middleware (validation, error handling)
├── types/           # TypeScript type definitions
├── db/              # Database migrations and seeds
└── utils/           # Utilities (logging, ID generation)
```

#### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|--------------|---------|
| **Routes** | HTTP endpoint definitions, URL mapping | `POST /api/chat/message` |
| **Controllers** | Request validation, response formatting, error handling | `ChatController.sendMessage()` |
| **Services** | Business logic, orchestration, LLM interaction | `ChatService.sendMessage()`, `LLMService.generateReplyStream()` |
| **Repositories** | Data persistence, SQL queries, transaction management | `MessageRepository.create()`, `ConversationRepository.getOrCreate()` |
| **Config** | Environment variables, database connection, Redis client | `getDatabase()`, `getRedisClient()` |

### Key Design Decisions

#### 1. **LLM Abstraction Layer**

The `ILLMService` interface allows swapping LLM providers without changing business logic:

```typescript
interface ILLMService {
  generateReplyStream(history: Message[], userMessage: string, onChunk: (chunk: string) => void): Promise<LLMResponse>;
}
```

**Benefits:**
- Easy to switch from Hugging Face → OpenAI → Anthropic
- Testable with mock implementations
- Provider-specific optimizations isolated to one class

#### 2. **Streaming-First Architecture**

Responses stream character-by-character via WebSocket for real-time UX:

- User sees response as it's generated (ChatGPT-like experience)
- Lower perceived latency
- Better user engagement

**Implementation:**
- Server-Sent Events (SSE) from Hugging Face API
- Socket.IO for WebSocket transport
- Placeholder messages updated incrementally

#### 3. **Graceful Degradation**

The application works without Redis:

- **With Redis:** Distributed rate limiting, ephemeral state
- **Without Redis:** In-memory rate limiting, no ephemeral state
- Database always required (SQLite)

**Why:** Simplifies deployment, works on free tiers, no single point of failure.

#### 4. **Session Continuity**

Conversations persist across page reloads:

- `sessionId` stored in `localStorage` (frontend)
- Conversations stored in SQLite (backend)
- Automatic conversation recovery on page load

#### 5. **Type Safety Throughout**

- **Zod** for runtime validation (env vars, API requests)
- **TypeScript** strict mode for compile-time safety
- Domain types (`Message`, `Conversation`) used consistently

#### 6. **Error Handling Strategy**

- **Custom error classes:** `AppError`, `LLMError` for domain-specific errors
- **Centralized error middleware:** Consistent error responses
- **User-friendly messages:** Technical errors never exposed to users
- **Structured logging:** All errors logged with context

---

## LLM Integration

### Provider: Hugging Face Inference API

**Model:** `meta-llama/Llama-3.2-3B-Instruct`  
**Endpoint:** `https://router.huggingface.co/v1/chat/completions`  
**API Format:** OpenAI-compatible chat completions API

### Why Hugging Face?

- ✅ **Free tier** - No credit card required, generous rate limits
- ✅ **Streaming support** - Server-Sent Events (SSE) for real-time responses
- ✅ **Fast inference** - ~2-3 second response times
- ✅ **Good instruction following** - Llama 3.2 3B is optimized for chat
- ✅ **Reliable uptime** - Production-grade infrastructure

### Prompting Strategy

The system uses a **structured system prompt** with three components:

#### 1. **Role Definition**
```
You are a helpful customer support agent for Spurline.
```

#### 2. **Behavioral Rules**
```
RULES:
1. Be concise - keep responses to 1-3 sentences max.
2. Only use information from the knowledge base below.
3. If you don't know something, say "I don't have that information, but you can email us at support@spurline.com"
4. NEVER use placeholders like [insert X] or [X]. Only give real information.
5. NEVER make up policies, prices, or contact details.
6. Match the user's language.
```

#### 3. **Domain Knowledge Base**
```
COMPANY INFO:
- Company: Spurline
- Email: support@spurline.com
- Hours: Monday-Friday 9AM-6PM EST

POLICIES:
- Shipping: Free on orders $50+. Standard delivery 5-7 business days.
- Returns: 30-day return policy. Items must be unused with tags attached.
- Payment: We accept Visa, Mastercard, Amex, PayPal, and Apple Pay.
- Tracking: Tracking number sent via email within 24 hours of shipment.
```

### Message Construction

The LLM service builds a conversation context:

```typescript
[
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: 'Previous user message' },
  { role: 'assistant', content: 'Previous AI response' },
  // ... (up to 8 recent messages for context)
  { role: 'user', content: 'Current user message' }
]
```

**Context Window:** Limited to last 8 messages to:
- Stay within token limits
- Maintain relevance (older messages may be irrelevant)
- Reduce latency

### Streaming Implementation

1. **SSE Parsing:** Hugging Face returns Server-Sent Events
2. **Chunk Extraction:** Parse `data:` lines for `content` field
3. **Real-time Emission:** Each chunk sent via Socket.IO to frontend
4. **Placeholder Updates:** Frontend updates message bubble incrementally

### Suggestion Generation

After the main response, a separate LLM call generates 3 follow-up questions:

```typescript
const SUGGESTION_PROMPT = `Generate exactly 3 short follow-up questions (max 5 words each) based on the conversation. Return ONLY a JSON array with no explanation. Example: ["Track my order?","Return policy?","Shipping cost?"]`;
```

**Why separate call?**
- Doesn't block main response
- Can be optimized independently
- Easier to handle failures (suggestions are optional)

### Error Handling

| Error Type | User Message | Technical Details |
|------------|--------------|-------------------|
| `429 Rate Limited` | "The agent is busy. Please try again." | Logged with retry-after |
| `503 Unavailable` | "Agent temporarily unavailable." | Logged with service status |
| `Timeout (>45s)` | "Response took too long. Try again." | Logged with duration |
| `Network Error` | "Failed to connect. Check your connection." | Logged with error details |

---

## API Reference

### Chat Endpoints

#### `POST /api/chat/message`

Send a message and receive AI response.

**Request Body:**
```json
{
  "sessionId": "optional-session-id",
  "content": "How do I track my order?"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv_123",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "userMessage": {
    "id": "msg_123",
    "content": "How do I track my order?",
    "sender": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "aiMessage": {
    "id": "msg_124",
    "content": "You'll receive a tracking number via email...",
    "sender": "ai",
    "createdAt": "2024-01-01T00:00:01Z"
  },
  "suggestions": ["Track my order?", "Return policy?", "Shipping cost?"]
}
```

**WebSocket Events:**
- `ai:typing` - AI is typing indicator
- `ai:stream:start` - Streaming started
- `ai:stream:chunk` - Text chunk received
- `ai:stream:end` - Streaming completed

#### `GET /api/chat/:sessionId`

Retrieve conversation history.

**Response:**
```json
{
  "conversation": {
    "id": "conv_123",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "messages": [
    {
      "id": "msg_123",
      "content": "How do I track my order?",
      "sender": "user",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "msg_124",
      "content": "You'll receive a tracking number...",
      "sender": "ai",
      "createdAt": "2024-01-01T00:00:01Z"
    }
  ]
}
```

### Health Endpoints

#### `GET /health`

Liveness check - indicates server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### `GET /health/ready`

Readiness check - indicates server is ready to accept traffic.

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Trade-offs & Design Decisions

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| **SQLite over PostgreSQL** | No concurrent writes at scale, limited to single server | Zero-config, perfect for demo/take-home. Easy migration path to Postgres if needed. |
| **sql.js over better-sqlite3** | Slightly slower (pure JS vs native) | No native compilation needed, works everywhere Node.js runs. Better for deployment flexibility. |
| **In-memory rate limiting** | Lost on server restart, not distributed | Simpler, Redis optional. Good enough for MVP. Can upgrade to Redis-backed later. |
| **Llama 3.2 3B over larger models** | Less capable than GPT-4/Claude | Free tier, fast inference, good enough for support use case. Can swap provider easily. |
| **WebSocket streaming over polling** | More complex, requires connection management | Better UX (real-time), lower latency, industry standard. |
| **Embedded domain knowledge** | Hard to update without code changes | Simple, works for MVP. Can externalize to database/config later. |
| **No authentication** | All conversations are anonymous | Faster to build, good for public support widget. Can add auth layer later. |
| **TypeScript strict mode** | More verbose, slower initial development | Catches bugs early, better maintainability, industry standard. |

---

## If I Had More Time

### 1. **Authentication & User Management**
- JWT-based authentication for personalized conversations
- User accounts with conversation history tied to profiles
- Admin dashboard for managing users and conversations
- OAuth integration (Google, GitHub)

### 2. **Admin Dashboard**
- View all conversations across all users
- Analytics: response times, common questions, user satisfaction
- Knowledge base management UI (update domain knowledge without code changes)
- Conversation search and filtering

### 3. **Comprehensive Testing**
- Unit tests for services and repositories
- Integration tests with test database
- E2E tests for critical user flows
- CI/CD pipeline with automated testing

### 4. **Multi-channel Support**
- WhatsApp Business API integration
- Instagram DM integration
- Email support integration
- Unified conversation view across channels

### 5. **Advanced Features**
- **RAG (Retrieval-Augmented Generation):** Vector search over knowledge base documents
- **Sentiment Analysis:** Detect frustrated users, escalate to human agents
- **Multi-language Support:** Automatic language detection and translation
- **Analytics & Monitoring:** Detailed metrics, error tracking, performance monitoring

### 6. **Production Hardening**
- Rate limiting per user/IP (not just per session)
- Request queuing for high traffic
- Database connection pooling
- Caching layer for common queries
- CDN for static assets

---

## Deployment

### Quick Deployment Guide

#### Backend (Render)

1. **Create Web Service:**
   - Connect GitHub repository
   - Build command: `cd backend && npm install && npm run build`
   - Start command: `cd backend && npm run migrate && npm start`
   - Plan: Starter (free tier)

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_PATH=/opt/render/project/src/backend/data/spurline.db
   HUGGINGFACE_API_TOKEN=hf_your_token_here
   FRONTEND_URL=https://spurline.asapabhi.me
   REDIS_URL=redis://localhost:6379  # Optional
   ```

3. **Persistent Disk:**
   - Add disk: 1GB
   - Mount path: `/opt/render/project/src/backend/data`

4. **Note Backend URL:** Save your Render backend URL (e.g., `https://spurline-backend.onrender.com`)

#### Frontend (Vercel)

1. **Create Project:**
   - Connect GitHub repository
   - Framework: SvelteKit
   - Root directory: `frontend`
   - Build command: `npm run build`

2. **Environment Variables:**
   ```
   PUBLIC_BACKEND_URL=https://spurline-backend.onrender.com
   ```

3. **Custom Domain:**
   - Add domain: `spurline.asapabhi.me`
   - Configure DNS: CNAME `spurline` → `cname.vercel-dns.com`

4. **Deploy:** Vercel auto-deploys on push to main branch

### Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads at `https://spurline.asapabhi.me`
- [ ] Chat widget connects to backend
- [ ] Socket.IO connection works (check browser console)
- [ ] Messages send and receive correctly
- [ ] Streaming responses work
- [ ] Database persists (send message, refresh, verify history)

---

## License

MIT

---

**Built with calm engineering by abhi.**
