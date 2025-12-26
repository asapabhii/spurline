# Spurline

A production-grade AI support agent with real persistence, streaming responses, and extensible architecture.

---

## Quick Start

### Prerequisites

- Node.js 20+
- Hugging Face account (free)

### 1. Clone & Install

```bash
git clone https://github.com/asapabhii/spurline.git
cd spurline

# Backend
cd backend && npm install

# Frontend
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
REDIS_URL=redis://localhost:6379  # Optional
```

**Get your Hugging Face token:**
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token (read access)
3. Paste into `.env`

### 3. Setup Database

```bash
cd backend

# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed
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

### 6. Verify Health

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}

curl http://localhost:3001/health/ready
# {"status":"ready","checks":{"database":"ok","redis":"ok"},...}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                        │
│  Components → Stores → API Client ↔ WebSocket (Socket.IO)       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express + TypeScript)              │
│                                                                 │
│  ┌─────────┐   ┌─────────────┐   ┌──────────────┐              │
│  │ Routes  │ → │ Controllers │ → │   Services   │              │
│  └─────────┘   └─────────────┘   └──────┬───────┘              │
│                                         │                       │
│                    ┌────────────────────┼────────────────────┐  │
│                    │                    │                    │  │
│                    ▼                    ▼                    ▼  │
│             ┌────────────┐      ┌─────────────┐      ┌───────┐ │
│             │ LLMService │      │ Repositories│      │ Redis │ │
│             │ (HF API)   │      │  (SQLite)   │      │(cache)│ │
│             └────────────┘      └─────────────┘      └───────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Layers

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP/WS endpoints, URL mapping |
| **Controllers** | Request validation, response formatting |
| **Services** | Business logic, LLM orchestration |
| **Repositories** | Data access, SQL queries |

### Key Design Decisions

1. **LLM Abstraction** - `ILLMService` interface allows swapping providers (HuggingFace → OpenAI → Anthropic) without changing business logic.

2. **Streaming First** - WebSocket streams responses character-by-character for real-time UX.

3. **Graceful Degradation** - App works without Redis; rate limiting falls back to in-memory.

4. **Session Continuity** - `sessionId` persists in localStorage + SQLite for conversation history across reloads.

---

## LLM Integration

### Provider

**Hugging Face Inference API** (Free Tier)  
**Model:** `meta-llama/Llama-3.2-3B-Instruct`

### Why This Choice

- Free tier, no credit card required
- Good instruction-following for support use cases
- Streaming support via SSE
- Fast inference (~2-3s responses)

### Prompting Strategy

```
System prompt includes:
1. Role: "Helpful customer support agent for Spurline"
2. Rules: Concise (1-3 sentences), no placeholders, no hallucinations
3. Domain knowledge: Shipping, returns, contact info
4. Fallback: "I don't have that information, email support@spurline.com"
```

### Error Handling

| Error | User Message |
|-------|--------------|
| 429 (Rate Limited) | "The agent is busy. Please try again." |
| 503 (Unavailable) | "Agent temporarily unavailable." |
| Timeout | "Response took too long. Try again." |

---

## API Endpoints

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message, get AI response |
| GET | `/api/chat/:sessionId` | Get conversation history |
| GET | `/api/chat/:sessionId/status` | Get typing status |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/ready` | Readiness check (DB + Redis) |

---

## Database Schema

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  channel TEXT DEFAULT 'web',
  metadata TEXT
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | development / production |
| `DATABASE_PATH` | No | SQLite path (default: ./data/spurline.db) |
| `HUGGINGFACE_API_TOKEN` | Yes | HuggingFace API token |
| `REDIS_URL` | No | Redis URL (optional) |
| `FRONTEND_URL` | No | Frontend URL for CORS (production) |

---

## Trade-offs Made

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| SQLite over Postgres | No concurrent writes at scale | Zero-config, perfect for demo |
| sql.js over better-sqlite3 | Slightly slower | Pure JS, no native compilation |
| In-memory rate limiting | Lost on restart | Simpler, Redis optional |
| Llama 3.2 3B | Smaller model | Free tier, fast, reliable |

---

## If I Had More Time...

1. **Authentication** - Add user accounts with JWT/OAuth for personalized conversations and conversation history tied to users.

2. **Admin Dashboard** - Build a dashboard to view all conversations, analytics, and manage the knowledge base.

3. **Integration Tests** - Add comprehensive tests with test database for CI/CD pipeline.

4. **Multi-channel Support** - WhatsApp Business API and Instagram DM integration for omnichannel support.

---

Built with calm engineering by abhi.
