# Spurline

A production-shaped AI support agent with real persistence, guardrails, and extensible architecture.

Built as a take-home assignment demonstrating industry-grade engineering practices.

---

## Features

- **Real-time Streaming** - ChatGPT-style response streaming via WebSocket
- **Persistent Conversations** - SQLite-backed with session continuity
- **Smart Suggestions** - Context-aware follow-up questions
- **Multi-language** - Responds in the user's language
- **Clean Architecture** - Strict separation of concerns
- **Production Logging** - Structured logs with timing metrics

---

## Quick Start

### Prerequisites

- Node.js 20+
- Hugging Face account (free)

### 1. Clone & Install

```bash
git clone https://github.com/asapabhii/spurline.git
cd spurline

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/spurline.db
HUGGINGFACE_API_TOKEN=hf_your_token_here
```

**Get your Hugging Face token:**
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token (read access is sufficient)
3. Paste into `.env`

### 3. Setup Database

```bash
cd backend
npm run migrate
npm run seed  # Optional: seed sample data
```

### 4. Start Services

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 5. Open the App

Visit [http://localhost:5173](http://localhost:5173)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                        │
│  Chat Widget → API Client → Svelte Stores → UI Components       │
│                      ↕ WebSocket (Socket.IO)                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP REST + WS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express + TypeScript)              │
│                                                                 │
│  Routes → Controllers → Services → Repositories → SQLite       │
│                            │                                    │
│                            ├── LLM Service (Hugging Face)       │
│                            └── Socket Service (real-time)       │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP contracts, URL mapping |
| **Controllers** | Request validation, response formatting |
| **Services** | Business logic, orchestration |
| **Repositories** | Data access, SQL queries |
| **Database** | SQLite for persistence |

### Key Design Decisions

- **LLM Isolation**: LLM only called from `LLMService` - never from controllers
- **Stream-first**: Real-time response streaming via WebSocket
- **SQLite for truth**: All conversation data persists in SQLite
- **Session continuity**: `sessionId` enables persistence across page reloads

---

## API Endpoints

### POST `/api/chat/message`
Send a message and receive AI response.

```json
// Request
{ "message": "What are your shipping options?", "sessionId": "uuid-optional" }

// Response
{ 
  "sessionId": "uuid", 
  "reply": "We offer free shipping...", 
  "messageId": "uuid", 
  "createdAt": "ISO8601",
  "suggestions": ["Track order?", "Return policy?", "Delivery time?"]
}
```

### GET `/api/chat/:sessionId`
Retrieve conversation history.

### GET `/api/chat/:sessionId/status`
Check typing indicator (fallback for WebSocket).

---

## LLM Integration

### Provider: Hugging Face Inference API (Free Tier)

**Model**: `meta-llama/Llama-3.2-3B-Instruct`

**Why this choice:**
- Free tier with no credit card required
- Good quality responses for support use cases
- Fast inference with streaming support
- Well-suited for instruction-following

### Prompting Strategy

The system prompt includes:
1. **Role definition**: Helpful support agent
2. **Behavior guidelines**: Concise, accurate, 1-2 sentences
3. **Domain knowledge**: Shipping, returns, support hours
4. **Guardrails**: Don't hallucinate policies

### Error Handling

| Error | User Message |
|-------|--------------|
| Rate Limited (429) | "The agent is currently busy. Please try again in a moment." |
| Service Unavailable (503) | "The agent is temporarily unavailable. Please try again shortly." |
| Timeout | "The response took too long. Please try again." |

---

## Database Schema

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  metadata TEXT
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

---

## Trade-offs Made

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| SQLite over Postgres | No concurrent writes at scale | Zero-config, perfect for demo/early stage |
| WebSocket over SSE | More complex | Better browser support, bidirectional |
| Session in localStorage | Lost on clear storage | No auth required, good for demo |
| Llama 3.2 3B | Smaller model | Free tier, fast, reliable |

---

## Deployment Notes

For the hosted demo, the backend is deployed as a single Node.js service using SQLite for persistence. This mirrors how an early-stage product might ship behind a feature flag.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_PATH` | No | SQLite file path (default: ./data/spurline.db) |
| `HUGGINGFACE_API_TOKEN` | Yes | HF API token for LLM |
| `FRONTEND_URL` | No | Frontend URL for CORS (production) |
| `REDIS_URL` | No | Redis for optional caching |

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
│   │   ├── services/       # Business logic, LLM, Socket
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Logger, ID generator
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/ # Svelte components
│   │   │   ├── services/   # API client, Socket client
│   │   │   ├── stores/     # State management
│   │   │   └── types/      # TypeScript types
│   │   └── routes/         # SvelteKit pages
│   └── package.json
│
└── README.md
```

---

## If I Had More Time...

### Infrastructure
- [ ] Docker Compose for local development
- [ ] Rate limiting per session
- [ ] Health check dashboard
- [ ] Integration tests with test database

### Features
- [ ] Conversation export
- [ ] Admin dashboard
- [ ] Knowledge base management

### Channel Extensions
- [ ] WhatsApp Business API integration
- [ ] Instagram DM integration
- [ ] Email fallback for offline

---

## License

MIT

---

Built with calm engineering by a founding-minded developer.
