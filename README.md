# EcosystemOS AI
### Intelligent Ecosystem Relationship Orchestration Platform

> AI-native platform that automates relationships between startups, mentors, investors, and accelerators — powered by Google Gemini AI and Vertex AI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                    │
│  Landing · Dashboard · Graph · Startups · Mentors · Admin   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                  BACKEND (Node.js / Express)                  │
│  Auth · Startups · Mentors · Programmes · Relationships      │
│  Verify · Match · Dashboard · Graph · Analytics              │
└──────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────────────────────┐
│ PostgreSQL  │ │ Gemini API │ │  Vertex AI / Firebase     │
│  Database   │ │  (AI Core) │ │  Embeddings / Auth        │
└─────────────┘ └────────────┘ └──────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui, TypeScript |
| Visualization | React Flow, Recharts, Framer Motion |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL 16 |
| AI | Google Gemini 1.5 Flash, Vertex AI Embeddings |
| Auth | JWT, bcrypt |
| Cloud | Google Cloud Run, Firebase, BigQuery |
| DevOps | Docker, Docker Compose |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Google Gemini API key (optional — mock fallback included)

### 1. Clone & Configure

```bash
git clone https://github.com/aniqamrin/BWAI_HACKATHON.git
cd BWAI_HACKATHON

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Run with Docker (Recommended)

```bash
# Production
docker-compose up --build

# Development (hot reload backend)
docker-compose -f docker-compose.dev.yml up
```

App will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/health

### 3. Run Locally (Without Docker)

**Backend:**
```bash
cd backend
npm install
# Make sure PostgreSQL is running and DATABASE_URL is set in .env
node src/db/migrate.js   # Run schema
node src/db/seed.js      # Load seed data
npm run dev              # Start with nodemon
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecosystemos.ai | Password123! |
| Startup | sarah@techstartup.co.ke | Password123! |
| Mentor | mchen@mentor.com | Password123! |

---

## API Documentation

### Authentication
```
POST /api/auth/register    Register new user
POST /api/auth/login       Login
GET  /api/auth/me          Get current user
```

### Startups
```
GET  /api/startups         List all startups
GET  /api/startups/:id     Get startup by ID
POST /api/startups/create  Register new startup
PUT  /api/startups/:id     Update startup
```

### AI Verification
```
POST /api/verify/startup          Verify startup with Gemini AI
GET  /api/verify/history/:id      Get verification history
```

### AI Matching
```
POST /api/match/mentor            AI mentor matching for startup
POST /api/match/programme         AI programme matching for startup
GET  /api/match/recommendations/:id  Get all recommendations
```

### Relationships
```
GET   /api/relationships          List relationships
POST  /api/relationships/create   Create relationship
POST  /api/relationships/:id/health   Analyze health with AI
POST  /api/relationships/:id/log  Log engagement activity
PATCH /api/relationships/:id/status  Update status
```

### Dashboard & Analytics
```
GET /api/dashboard/overview    Ecosystem overview stats
GET /api/dashboard/analytics   Analytics summary
GET /api/dashboard/insights    AI-generated ecosystem insights
```

### Graph
```
GET /api/graph/network    Full ecosystem graph (nodes + edges)
```

---

## AI Workflow

### 1. Startup Verification
```
Startup Profile → Gemini 1.5 Flash → JSON Response
{
  verification_score: 87.5,
  risk_level: "low",
  industry_classification: "FinTech",
  strengths: [...],
  risk_factors: [...],
  recommendations: [...],
  ai_summary: "..."
}
```

### 2. Mentor Matching
```
Startup + Mentor Profiles → Gemini → Compatibility Score
{
  compatibility_score: 94.5,
  confidence_score: 91.0,
  reasoning: "...",
  recommended_focus_areas: [...],
  estimated_impact: "High"
}
```

### 3. Relationship Health
```
Relationship + Engagement Logs → Gemini → Health Report
{
  engagement_health: "excellent",
  health_score: 88,
  risk_of_inactivity: "low",
  recommended_next_actions: [...],
  intervention_suggestions: []
}
```

### 4. Ecosystem Intelligence
```
Aggregate Ecosystem Data → Gemini → Strategic Insights
{
  ecosystem_health_score: 74,
  key_insights: [...],
  opportunities: [...],
  risks: [...],
  recommendations: [...]
}
```

> **Note:** All AI calls include mock fallbacks. If `GEMINI_API_KEY` is not set, the system returns realistic mock data so the platform is fully demo-able without an API key.

---

## Demo Flow (3 Minutes)

1. **Landing Page** → Show hero, features, architecture
2. **Login** as Admin (`admin@ecosystemos.ai` / `Password123!`)
3. **Dashboard** → Show AI health banner, stats, ecosystem metrics
4. **Ecosystem Graph** → Interactive React Flow visualization
5. **Startups** → Register a new startup → Run AI Verification
6. **Mentors** → Click "AI Match for My Startup" → Show compatibility scores
7. **Relationships** → Show AI-generated relationships, click "Analyze Health"
8. **Admin Panel** → Full oversight, AI insights tab

---

## Project Structure

```
BWAI_HACKATHON/
├── backend/
│   ├── server.js
│   └── src/
│       ├── db/           schema.sql, seed.sql, connection.js
│       ├── routes/       auth, startups, mentors, programmes,
│       │                 investors, verify, match, relationships,
│       │                 dashboard, graph
│       ├── services/     geminiService, verificationService,
│       │                 matchingService, relationshipService,
│       │                 analyticsService
│       ├── middlewares/  auth.js, validate.js
│       └── utils/        logger.js, response.js
├── frontend/
│   ├── app/              layout, globals.css, all pages
│   ├── components/
│   │   ├── ui/           shadcn components
│   │   ├── layout/       Sidebar, DashboardLayout
│   │   └── shared/       StatCard, ScoreRing, PageHeader
│   ├── hooks/            useAuth, useApi
│   ├── lib/              api.ts, auth.ts, utils.ts
│   └── types/            index.ts
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

---

## Deployment

### Google Cloud Run (Backend)

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/ecosystemos-backend ./backend

# Deploy to Cloud Run
gcloud run deploy ecosystemos-backend \
  --image gcr.io/YOUR_PROJECT/ecosystemos-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=...,GEMINI_API_KEY=...,JWT_SECRET=...
```

### Firebase Hosting (Frontend)

```bash
cd frontend
npm run build

firebase init hosting
firebase deploy
```

### Cloud SQL (PostgreSQL)

```bash
gcloud sql instances create ecosystemos-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create ecosystemos_db --instance=ecosystemos-db
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `VERTEX_AI_LOCATION` | Vertex AI region (default: us-central1) |
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend |

---

## Security

- JWT authentication with expiry
- bcrypt password hashing (10 rounds)
- Helmet.js security headers
- Rate limiting (200 req/15min)
- Input validation (express-validator)
- CORS configuration
- Non-root Docker user
- Environment variable secrets

**Future Compliance:**
- GDPR: Data export, right to erasure, consent management
- PDPA: Data localisation, privacy notices
- SOC 2: Audit logging, access controls

---

## Scalability Roadmap

- [ ] Redis caching for AI responses
- [ ] WebSocket real-time relationship updates
- [ ] BigQuery analytics pipeline
- [ ] Vertex AI vector embeddings for semantic matching
- [ ] Multi-tenant ecosystem support
- [ ] Mobile app (React Native)
- [ ] Webhook integrations (Slack, email)
- [ ] Advanced graph analytics (PageRank, community detection)

---

Built for **Google Cloud AI Hackathon** · Powered by **Gemini AI** · Deployed on **Google Cloud**
