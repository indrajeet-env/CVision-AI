# CVision

CVision is a Gen-AI interview preparation platform that helps users generate tailored interview reports, identify skill gaps, and build a focused preparation roadmap from a resume/job description.

## Why the name CVision?

The name combines:
- **CV** (resume/candidate profile)
- **Vision** (AI-powered insights and direction)

In short, CVision means *seeing your interview readiness clearly*.

## Live Demo

[Go For It](https://cvision-dqi7.onrender.com)

## Note

**Resume download has a production fallback PDF path for reliability on hosted environments where browser-based rendering can fail unknowingly.**

## Local Setup

### 1) Clone and install

```bash
git clone <your-repo-url>
cd JobDekho
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables

Backend (`backend/.env`):
- `PORT=3069`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `GOOGLE_GENAI_API_KEY=...`
- `FRONTEND_URL=http://localhost:5173`
- `NODE_ENV=development`

Frontend (`frontend/.env.local`):
- `VITE_API_URL=http://localhost:3069`

### 3) Run the app

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.