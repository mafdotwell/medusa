# Vercel Deployment Guide

This guide will help you deploy your Medusa marketplace application to Vercel.

## Architecture Overview

Your application consists of two parts:

1. **Frontend (Next.js)** - Deploy to Vercel ✅
2. **Backend (Medusa)** - Deploy separately (Railway, Render, etc.) ⚠️

**Why separate deployments?**
- Medusa backend requires PostgreSQL and Redis
- Needs long-running processes and background jobs
- Vercel is optimized for serverless functions, not full Node.js apps

## Deployment Steps

### Part 1: Deploy Backend (Medusa)

The backend needs to be deployed to a platform that supports:
- PostgreSQL database
- Redis cache
- Long-running Node.js processes

**Recommended Platforms:**
- **Railway** (easiest) - https://railway.app
- **Render** - https://render.com
- **DigitalOcean App Platform** - https://www.digitalocean.com
- **AWS/GCP/Azure** - For enterprise setups

#### Quick Deploy with Railway:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `barsell` repository

3. **Add Services**
   - **PostgreSQL**: Click "+ New" → "Database" → "PostgreSQL"
   - **Redis**: Click "+ New" → "Database" → "Redis"
   - **Web Service**: Your Medusa backend

4. **Configure Environment Variables**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your-secret-key-here
   COOKIE_SECRET=your-cookie-secret-here
   INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
   INSTANTDB_ADMIN_TOKEN=your-instantdb-admin-token
   STORE_CORS=https://your-frontend.vercel.app
   ADMIN_CORS=https://your-frontend.vercel.app
   AUTH_CORS=https://your-frontend.vercel.app
   ```

5. **Deploy**
   - Railway will automatically detect it's a Node.js app
   - It will run `npm install` and `npm start`
   - Note the deployment URL (e.g., `https://your-backend.railway.app`)

6. **Run Migrations**
   ```bash
   # In Railway, go to your service → Settings → Deploy
   # Or use Railway CLI:
   railway run npm run build
   railway run npx medusa db:migrate
   ```

### Part 2: Deploy Frontend to Vercel

#### Option A: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to https://vercel.com
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your repository
   - **Important**: Set Root Directory to `barsell-storefront`

2. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `barsell-storefront`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (default)

3. **Set Environment Variables**
   Go to Project Settings → Environment Variables and add:

   ```env
   MEDUSA_BACKEND_URL=https://your-backend.railway.app
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_your_key_here
   NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
   NEXT_PUBLIC_DEFAULT_REGION=us
   ```

   **Important**: 
   - Get `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` from your deployed Medusa admin
   - Go to `https://your-backend.railway.app/app` → Settings → Publishable API Keys

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Navigate to Frontend Directory**
   ```bash
   cd barsell-storefront
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add MEDUSA_BACKEND_URL
   vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
   vercel env add NEXT_PUBLIC_INSTANTDB_APP_ID
   vercel env add NEXT_PUBLIC_DEFAULT_REGION
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update CORS Settings

After deploying both services, update your backend CORS settings:

**In Railway (Backend Environment Variables):**
```env
STORE_CORS=https://your-frontend.vercel.app
ADMIN_CORS=https://your-frontend.vercel.app
AUTH_CORS=https://your-frontend.vercel.app
```

Then redeploy the backend.

### 2. Update Frontend Backend URL

**In Vercel (Frontend Environment Variables):**
```env
MEDUSA_BACKEND_URL=https://your-backend.railway.app
```

Then redeploy the frontend.

### 3. Create Publishable API Key

1. Go to your deployed Medusa admin: `https://your-backend.railway.app/app`
2. Navigate to Settings → Publishable API Keys
3. Create a new key
4. Copy the key
5. Add it to Vercel environment variables as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

## Environment Variables Summary

### Backend (Railway/Render/etc.)

```env
# Database
DATABASE_URL=postgres://...
REDIS_URL=redis://...

# Security
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret

# InstantDB
INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
INSTANTDB_ADMIN_TOKEN=your-admin-token

# CORS (update with your Vercel URL)
STORE_CORS=https://your-frontend.vercel.app
ADMIN_CORS=https://your-frontend.vercel.app
AUTH_CORS=https://your-frontend.vercel.app
```

### Frontend (Vercel)

```env
# Medusa Backend
MEDUSA_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_...

# InstantDB
NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b

# Defaults
NEXT_PUBLIC_DEFAULT_REGION=us
```

## Troubleshooting

### Frontend can't connect to backend

- Verify `MEDUSA_BACKEND_URL` is correct in Vercel
- Check backend CORS settings include your Vercel URL
- Ensure backend is running and accessible

### CORS errors

- Add your Vercel URL to backend CORS environment variables
- Restart backend after updating CORS

### Build errors

- Check Node.js version (should be >= 20)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check database is accessible from your backend host
- Ensure migrations have been run

## Continuous Deployment

Both platforms support automatic deployments:

- **Vercel**: Automatically deploys on push to main branch
- **Railway**: Automatically deploys on push to main branch

Make sure your main branch is set up correctly in both platforms.

## Cost Estimates

- **Vercel**: Free tier available (Hobby plan)
- **Railway**: ~$5-20/month for small apps
- **Render**: Free tier available (with limitations)

## Next Steps

1. ✅ Deploy backend to Railway/Render
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ✅ Update CORS settings
5. ✅ Create publishable API key
6. ✅ Test the deployed application

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Medusa Deployment: https://docs.medusajs.com/deployments/server

