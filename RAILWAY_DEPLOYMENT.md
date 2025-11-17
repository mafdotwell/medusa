# Railway Deployment Guide - Full Stack

This guide will help you deploy both your Medusa backend and Next.js frontend to Railway.

## Architecture Overview

Both services will be deployed on Railway:
- **Backend (Medusa)** - Railway Web Service
- **Frontend (Next.js)** - Railway Web Service
- **PostgreSQL** - Railway Database Service
- **Redis** - Railway Database Service

## Prerequisites

1. GitHub account with your repository
2. Railway account (sign up at https://railway.app)

## Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. Note the connection details (you'll use `DATABASE_URL`)

### Step 3: Add Redis Cache

1. Click "+ New" again
2. Select "Database" → "Add Redis"
3. Railway will create a Redis instance
4. Note the connection URL (you'll use `REDIS_URL`)

### Step 4: Deploy Backend (Medusa)

1. Click "+ New" → "GitHub Repo"
2. Select your repository again
3. Railway will detect it's a Node.js project
4. **Important**: Set the **Root Directory** to `barsell`

#### Configure Backend Service:

1. Go to the backend service → Settings
2. Set **Root Directory**: `barsell`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm start`

#### Add Backend Environment Variables:

Go to the backend service → Variables and add:

```env
# Database (use Railway's template variables)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
COOKIE_SECRET=your-super-secret-cookie-key-change-this

# InstantDB
INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
INSTANTDB_ADMIN_TOKEN=your-instantdb-admin-token-here

# CORS (update after frontend is deployed)
STORE_CORS=https://your-frontend.railway.app
ADMIN_CORS=https://your-frontend.railway.app
AUTH_CORS=https://your-frontend.railway.app
```

**Important**: 
- Replace `your-super-secret-jwt-key-change-this` with a secure random string
- Replace `your-instantdb-admin-token-here` with your actual InstantDB admin token
- Update CORS URLs after deploying the frontend

#### Deploy Backend:

1. Railway will automatically start building
2. Wait for deployment to complete
3. Note the generated URL (e.g., `https://your-backend.railway.app`)
4. You can set a custom domain in Settings → Networking

### Step 5: Run Database Migrations

After the backend is deployed:

1. Go to backend service → Deployments
2. Click on the latest deployment
3. Go to "Logs" tab
4. Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run --service backend npx medusa db:migrate
```

### Step 6: Deploy Frontend (Next.js)

1. Click "+ New" → "GitHub Repo"
2. Select your repository again
3. **Important**: Set the **Root Directory** to `barsell-storefront`

#### Configure Frontend Service:

1. Go to the frontend service → Settings
2. Set **Root Directory**: `barsell-storefront`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm start`
5. Set **Node Version**: `20` (or latest)

#### Add Frontend Environment Variables:

Go to the frontend service → Variables and add:

```env
# Medusa Backend URL (use your backend service URL)
MEDUSA_BACKEND_URL=https://your-backend.railway.app

# Publishable API Key (get from Medusa admin after backend is deployed)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_your_key_here

# InstantDB
NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b

# Default Region
NEXT_PUBLIC_DEFAULT_REGION=us

# Node Environment
NODE_ENV=production
```

**Important**: 
- Replace `https://your-backend.railway.app` with your actual backend URL
- You'll need to get the publishable key from your deployed Medusa admin

#### Deploy Frontend:

1. Railway will automatically start building
2. Wait for deployment to complete
3. Note the generated URL (e.g., `https://your-frontend.railway.app`)

### Step 7: Update CORS Settings

After both services are deployed:

1. Go to backend service → Variables
2. Update CORS variables with your frontend URL:
   ```env
   STORE_CORS=https://your-frontend.railway.app
   ADMIN_CORS=https://your-frontend.railway.app
   AUTH_CORS=https://your-frontend.railway.app
   ```
3. Redeploy the backend service

### Step 8: Create Publishable API Key

1. Go to your deployed backend admin: `https://your-backend.railway.app/app`
2. Login (create admin user if needed)
3. Navigate to **Settings** → **Publishable API Keys**
4. Click **Create Publishable Key**
5. Copy the key (starts with `pk_`)
6. Go to frontend service → Variables
7. Update `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` with the actual key
8. Redeploy the frontend

## Railway Configuration Files

I've created these files to help Railway detect your services:

- `barsell/railway.json` - Backend configuration
- `barsell/Procfile` - Backend process file
- `barsell-storefront/railway.json` - Frontend configuration (will create)

## Custom Domains

### Backend Domain:

1. Go to backend service → Settings → Networking
2. Click "Generate Domain" or "Custom Domain"
3. Add your custom domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed

### Frontend Domain:

1. Go to frontend service → Settings → Networking
2. Click "Generate Domain" or "Custom Domain"
3. Add your custom domain (e.g., `yourdomain.com`)
4. Update DNS records as instructed

## Environment Variables Summary

### Backend Service Variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
INSTANTDB_ADMIN_TOKEN=your-admin-token
STORE_CORS=https://your-frontend.railway.app
ADMIN_CORS=https://your-frontend.railway.app
AUTH_CORS=https://your-frontend.railway.app
```

### Frontend Service Variables:

```env
MEDUSA_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
NEXT_PUBLIC_DEFAULT_REGION=us
NODE_ENV=production
```

## Troubleshooting

### Backend won't start

- Check logs in Railway dashboard
- Verify `DATABASE_URL` and `REDIS_URL` are set correctly
- Ensure migrations have been run
- Check Node.js version (should be >= 20)

### Frontend build fails

- Check build logs in Railway
- Verify all environment variables are set
- Ensure `MEDUSA_BACKEND_URL` points to your backend
- Check Node.js version

### CORS errors

- Verify CORS URLs in backend match your frontend URL
- Ensure backend has been redeployed after CORS changes
- Check browser console for specific CORS errors

### Database connection errors

- Verify `DATABASE_URL` is using Railway's template variable
- Check PostgreSQL service is running
- Ensure database migrations have been run

### Frontend can't connect to backend

- Verify `MEDUSA_BACKEND_URL` is correct
- Check backend is running and accessible
- Verify publishable API key is set correctly

## Railway CLI Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run migrations
railway run --service backend npx medusa db:migrate

# Open service
railway open
```

## Cost Estimates

Railway pricing:
- **Free Trial**: $5 credit
- **Hobby Plan**: ~$5-20/month for small apps
- **Pro Plan**: Pay-as-you-go

Typical costs for this setup:
- PostgreSQL: ~$5/month
- Redis: ~$5/month
- Backend service: ~$5-10/month
- Frontend service: ~$5-10/month
- **Total**: ~$20-30/month

## Continuous Deployment

Railway automatically deploys when you push to your main branch:
- Push to `main` → Automatic deployment
- Each service deploys independently
- View deployment status in Railway dashboard

## Next Steps

1. ✅ Create Railway project
2. ✅ Add PostgreSQL and Redis
3. ✅ Deploy backend service
4. ✅ Run database migrations
5. ✅ Deploy frontend service
6. ✅ Update CORS settings
7. ✅ Create publishable API key
8. ✅ Test deployed application
9. ✅ Set up custom domains (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Medusa Docs: https://docs.medusajs.com

