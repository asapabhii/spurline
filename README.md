# Spurline AI Support Agent

![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![SvelteKit](https://img.shields.io/badge/SvelteKit-Frontend-orange)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

**🌐 [Live Website](https://spurline.asapabhi.me/)**
Note: Sometimes it might take upto 50 seconds to get a response on the website as its being hosted on a free instance of render.

AI support chat with real-time streaming responses. Built with SvelteKit, Express, PostgreSQL, and Hugging Face LLM.

---

## Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn**
- **Hugging Face account** (free tier works)
- **PostgreSQL** (for production) or SQLite (for local dev)

### Installation

```bash
git clone https://github.com/asapabhii/spurline.git
cd spurline

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Setup

**Backend** (`.env` file):

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost/spurline  # PostgreSQL
# OR for local dev with SQLite: DATABASE_PATH=./data/spurline.db
HUGGINGFACE_API_TOKEN=hf_your_token_here
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379  # Optional
```

**Frontend** (`.env` file):

```env
PUBLIC_BACKEND_URL=http://localhost:3001
```

### Database Setup

```bash
cd backend
npm run migrate  # Creates tables in PostgreSQL/SQLite
npm run seed     # Optional: sample data
```

### Run Locally

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## Architecture

**Backend:** Express + TypeScript + PostgreSQL  
**Frontend:** SvelteKit + TypeScript  
**LLM:** Hugging Face (Llama 3.2 3B Instruct)  
**Real-time:** Socket.IO (WebSocket streaming)

### Backend Layers

- **Routes** → HTTP/WS endpoints
- **Controllers** → Request validation, response formatting
- **Services** → Business logic, LLM orchestration
- **Repositories** → PostgreSQL data access

### Design Decisions

- PostgreSQL for production (migrated from SQLite)
- Streaming responses for better UX
- Works without Redis (optional)
- TypeScript + Zod for type safety

---

## LLM Integration

**Provider:** Hugging Face Inference API  
**Model:** `meta-llama/Llama-3.2-3B-Instruct`

### Why Hugging Face?

-  Free tier, no credit card
-  Fast inference (~2-3s responses)
-  Streaming support via SSE
-  Reliable uptime
---

## Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| PostgreSQL over SQLite | Requires managed DB | Better for production, concurrent writes |
| Llama 3.2 3B | Smaller model | Free tier, fast, good enough for support |
| Streaming responses | More complex | Better UX (ChatGPT-like) |
| Socket.IO | Requires WebSocket | Real-time, industry standard |

---

## If I Had More Time

1. **Authentication** - User accounts, personalized conversations
2. **Admin Dashboard** - View conversations, analytics
3. **Testing** - Comprehensive test suite
4. **Multi-channel** - WhatsApp, Instagram integration

---

**Built with calm engineering by abhi.**
