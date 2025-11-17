# Quick Railway Deployment Guide

## 🚀 Deploy Everything to Railway in 5 Steps

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### Step 2: Add Databases
1. Click "+ New" → "Database" → "Add PostgreSQL"
2. Click "+ New" → "Database" → "Add Redis"

### Step 3: Deploy Backend
1. Click "+ New" → "GitHub Repo" → Select your repo
2. **Set Root Directory**: `barsell`
3. **Add Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=change-this-secret-key
   COOKIE_SECRET=change-this-cookie-secret
   INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
   INSTANTDB_ADMIN_TOKEN=your-token-here
   ```
4. Wait for deployment
5. Note the backend URL (e.g., `https://xxx.railway.app`)

### Step 4: Deploy Frontend
1. Click "+ New" → "GitHub Repo" → Select your repo
2. **Set Root Directory**: `barsell-storefront`
3. **Add Variables**:
   ```
   MEDUSA_BACKEND_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_placeholder
   NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
   NEXT_PUBLIC_DEFAULT_REGION=us
   ```
4. Wait for deployment
5. Note the frontend URL

### Step 5: Final Configuration
1. **Update Backend CORS** (backend service → Variables):
   ```
   STORE_CORS=https://your-frontend-url.railway.app
   ADMIN_CORS=https://your-frontend-url.railway.app
   AUTH_CORS=https://your-frontend-url.railway.app
   ```
2. **Get Publishable Key**:
   - Go to `https://your-backend-url.railway.app/app`
   - Settings → Publishable API Keys → Create
   - Copy the key
3. **Update Frontend** (frontend service → Variables):
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_your_actual_key
   ```

## ✅ Done!

Your app should now be live at:
- Frontend: `https://your-frontend-url.railway.app`
- Backend: `https://your-backend-url.railway.app`
- Admin: `https://your-backend-url.railway.app/app`

## 📚 Full Guide

See `RAILWAY_DEPLOYMENT.md` for detailed instructions and troubleshooting.

