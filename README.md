# Spurline AI Support Agent

![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![SvelteKit](https://img.shields.io/badge/SvelteKit-Frontend-orange)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

**🌐 [Live Website](https://spurline.asapabhi.me/)**

A production-grade AI customer support agent with real-time streaming, persistent PostgreSQL database, and clean architecture. Built with SvelteKit, Express, and Hugging Face LLM.

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

### Key Design Decisions

- **PostgreSQL** for production persistence (migrated from SQLite)
- **Streaming-first** architecture for ChatGPT-like UX
- **Graceful degradation** - works without Redis
- **Type-safe** throughout (TypeScript + Zod validation)

---

## LLM Integration

**Provider:** Hugging Face Inference API  
**Model:** `meta-llama/Llama-3.2-3B-Instruct`

### Why Hugging Face?

- ✅ Free tier, no credit card
- ✅ Fast inference (~2-3s responses)
- ✅ Streaming support via SSE
- ✅ Reliable uptime

### Prompting Strategy

Structured system prompt with:
1. **Role:** Customer support agent for Spurline
2. **Rules:** Concise (1-3 sentences), no placeholders, match user language
3. **Domain Knowledge:** Shipping, returns, contact info embedded

---

## Deployment

### Backend (Render)

1. Create **PostgreSQL** database on Render (free tier)
2. Create **Web Service**:
   - Root Directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm run migrate && npm start`
3. Environment Variables:
   - `DATABASE_URL` (from PostgreSQL service)
   - `HUGGINGFACE_API_TOKEN`
   - `FRONTEND_URL=https://spurline.asapabhi.me`
4. Note backend URL (e.g., `https://spurline-backend.onrender.com`)

### Frontend (Vercel)

1. Import GitHub repo
2. Framework: SvelteKit
3. Root Directory: `frontend`
4. Environment Variable: `PUBLIC_BACKEND_URL` = your Render backend URL
5. Add custom domain: `spurline.asapabhi.me`

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
