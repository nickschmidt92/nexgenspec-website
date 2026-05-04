# Northbound SEO — Setup Guide

## 1. Create accounts (required before running)

### Firebase (Auth)
1. Go to https://console.firebase.google.com
2. Create project: `northbound-seo`
3. Enable Authentication → Sign-in method → Email/Password
4. Go to Project Settings → Your apps → Add web app
5. Copy config values to `frontend/.env.local`

### Supabase (Database)
1. Go to https://supabase.com → New project: `northbound-seo`
2. Settings → Database → Connection string (URI mode)
3. Replace `[YOUR-PASSWORD]` with your password
4. Change prefix from `postgresql://` to `postgresql+asyncpg://`
5. Add to `backend/.env` as `DATABASE_URL`

### DataForSEO (Keyword data)
1. Go to https://dataforseo.com → Register
2. Add $20-50 prepaid credit
3. Copy login + password to `backend/.env`

### Anthropic API (AI)
1. Go to https://console.anthropic.com → Register (separate from Claude.ai)
2. API Keys → Create new key
3. Add $20 credit
4. Add to `backend/.env` as `ANTHROPIC_API_KEY`

## 2. Configure environment

### backend/.env
```
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]:5432/northbound_seo
FIREBASE_PROJECT_ID=northbound-seo
ANTHROPIC_API_KEY=sk-ant-...
DATAFORSEO_LOGIN=your@email.com
DATAFORSEO_PASSWORD=your-password
CORS_ORIGINS=["http://localhost:3000","https://app.northboundgrowthco.com"]
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=northbound-seo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=northbound-seo
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
```

## 3. Run database migrations
```bash
cd backend
poetry install
alembic upgrade head
```

## 4. Start dev servers
```bash
# Terminal 1
make dev-backend

# Terminal 2
make dev-frontend
```

Open http://localhost:3000

## 5. Test with your sites
- northboundgrowthco.com
- diainspections.com  
- nexgenspec.com

## 6. Deploy
- Backend: Push to Railway
- Frontend: Push to Vercel, point app.northboundgrowthco.com DNS to Vercel
