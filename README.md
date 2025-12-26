# Spurline

A production-shaped AI live chat support agent with persistent conversations, Redis-backed UX signals, clean LLM isolation, and extensible architecture.

Built as a take-home assignment demonstrating industry-grade engineering practices.

---

## Quick Start (< 10 minutes)

### Prerequisites

- Node.js 20+
- Redis (local or hosted)
- Hugging Face account (free)

### 1. Clone & Install

```bash
git clone https://github.com/asapabhii/spurline.git
cd spurline

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend configuration
cd backend
cp env.example .env
```

Edit `.env` with your values:

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/spurline.db
REDIS_URL=redis://localhost:6379
HUGGINGFACE_API_TOKEN=hf_your_token_here
```

**Get your Hugging Face token:**
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token (read access is sufficient)
3. Copy and paste into `.env`

### 3. Setup Database

```bash
cd backend

# Run migrations
npm run migrate

# (Optional) Seed sample data
npm run seed
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open the App

Visit [http://localhost:5173](http://localhost:5173)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                        │
│  Chat Widget → API Client → Svelte Stores → UI Components       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express + TypeScript)              │
│                                                                 │
│  Routes → Controllers → Services → Repositories → SQLite       │
│                            │                                    │
│                            ├── LLM Service (Hugging Face)       │
│                            └── Typing Service (Redis)           │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP contracts, URL mapping |
| **Controllers** | Request validation, response formatting |
| **Services** | Business logic, orchestration |
| **Repositories** | Data access, SQL queries |
| **Database** | SQLite for persistence, Redis for ephemeral state |

### Key Design Decisions

- **LLM Isolation**: The LLM is only ever called from `LLMService` - never from controllers or routes
- **Redis for UX only**: Redis stores typing indicators with TTL, never authoritative data
- **SQLite for truth**: All conversation and message data persists in SQLite
- **Session continuity**: `sessionId` enables conversation persistence across page reloads

---

## API Endpoints

### POST `/api/chat/message`
Send a message and receive AI response.

```json
// Request
{ "message": "What are your shipping options?", "sessionId": "uuid-optional" }

// Response
{ "sessionId": "uuid", "reply": "We offer free shipping...", "messageId": "uuid", "createdAt": "ISO8601" }
```

### GET `/api/chat/:sessionId`
Retrieve conversation history.

### GET `/api/chat/:sessionId/status`
Check typing indicator and future status fields.

```json
{ "isTyping": true }
```

---

## LLM Integration

### Provider: Hugging Face Inference API (Free Tier)

**Model**: `mistralai/Mistral-7B-Instruct-v0.2`

**Why this choice:**
- Free tier with no credit card required
- Good quality responses for support use cases
- Fast inference times
- Well-suited for instruction-following

### Prompting Strategy

The system prompt includes:
1. **Role definition**: Helpful customer support agent
2. **Behavior guidelines**: Clear, concise, honest responses
3. **Domain knowledge**: Shipping, returns, support hours
4. **Guardrails**: Don't hallucinate policies

```
You are a helpful customer support agent for a small e-commerce brand.
Answer clearly, concisely, and accurately.
If you do not know something, say so honestly.
Do not hallucinate policies.
```

### Context Management

- Last 10 messages included in context
- Prevents token overflow and rate limiting
- Maintains conversation coherence

### Error Handling

| Error | User Message |
|-------|--------------|
| Rate Limited (429) | "The agent is currently busy. Please try again in a moment." |
| Service Unavailable (503) | "The agent is temporarily unavailable. Please try again shortly." |
| Timeout | "The response took too long. Please try again with a shorter message." |

---

## Database Schema

```sql
-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  metadata TEXT
);

-- Messages  
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

---

## Trade-offs Made

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| SQLite over Postgres | No concurrent writes at scale | Zero-config, perfect for demo/early stage |
| Polling over WebSocket | Slight latency on typing status | Simpler implementation, sufficient for UX |
| Session in localStorage | Lost on clear storage | No auth required, good enough for demo |
| Mistral 7B over larger models | Potentially less nuanced answers | Free tier, fast, good quality |
| Express over Fastify | Slightly slower | More ecosystem support, easier for reviewers |

---

## Deployment Notes

For the hosted demo, the backend is deployed as a single Node.js service using SQLite for persistence and Redis for ephemeral UX state. This mirrors how an early-stage product might ship behind a feature flag.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_PATH` | No | SQLite file path (default: ./data/spurline.db) |
| `REDIS_URL` | Yes | Redis connection URL |
| `HUGGINGFACE_API_TOKEN` | Yes | HF API token for LLM |
| `FRONTEND_URL` | No | Frontend URL for CORS (production) |

---

## If I Had More Time...

### Immediate Improvements
- [ ] WebSocket for real-time typing indicators
- [ ] Message streaming (show AI response as it generates)
- [ ] Rate limiting per session
- [ ] Request ID tracing for debugging

### Product Features
- [ ] Conversation export
- [ ] User feedback on AI responses (👍/👎)
- [ ] Suggested follow-up questions
- [ ] Multi-language support

### Infrastructure
- [ ] Docker Compose for local development
- [ ] Health check dashboard
- [ ] Structured logging with correlation IDs
- [ ] Integration tests with test database

### Channel Extensions
- [ ] WhatsApp Business API integration
- [ ] Instagram DM integration
- [ ] Email fallback for offline

---

## Project Structure

```
spurline/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, environment
│   │   ├── controllers/    # Request handlers
│   │   ├── db/             # Migrations, seeds
│   │   ├── middleware/     # Error handling, validation
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic, LLM
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helpers
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/ # Svelte components
│   │   │   ├── services/   # API client
│   │   │   ├── stores/     # State management
│   │   │   └── types/      # TypeScript types
│   │   └── routes/         # SvelteKit pages
│   ├── package.json
│   └── svelte.config.js
│
└── README.md
```

---

## License

MIT

---

Built with calm engineering by a founding-minded developer.

