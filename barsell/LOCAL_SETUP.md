# Local Development Setup Guide

## Current Issue

The frontend is showing an error because it can't connect to the backend API at `http://localhost:9000`.

## Prerequisites

You need the following services running:

1. **PostgreSQL** ✅ (Running on port 5432)
2. **Redis** ❌ (Not running on port 6379)
3. **Medusa Backend** ❌ (Not running on port 9000)

## Quick Fix Steps

### 1. Start Redis

**Option A: Using Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option B: Install Redis locally**
- Windows: Download from https://github.com/microsoftarchive/redis/releases
- Mac: `brew install redis` then `brew services start redis`
- Linux: `sudo apt-get install redis-server` then `sudo systemctl start redis`

### 2. Start the Backend Server

```bash
cd barsell
npm run dev
```

Wait for the server to start. You should see:
```
Server is ready on port: 9000
```

### 3. Create Frontend Environment File

Create `barsell-storefront/.env.local` with:

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
NEXT_PUBLIC_DEFAULT_REGION=us
```

**Note:** You'll need to get a real publishable key from your Medusa admin:
1. Go to http://localhost:9000/app
2. Navigate to Settings > Publishable API Keys
3. Create a new key or use an existing one
4. Replace `pk_test_placeholder` with the actual key

### 4. Restart Frontend

The frontend should automatically reload, but if not:
```bash
cd barsell-storefront
npm run dev
```

## Verify Everything is Working

1. **Backend Health Check**: http://localhost:9000/health
   - Should return: `{"status":"ok"}`

2. **Frontend**: http://localhost:8000
   - Should load without errors

3. **Admin Dashboard**: http://localhost:9000/app
   - Should show the Medusa admin interface

## Troubleshooting

### Backend won't start

- Check if PostgreSQL is running: `Test-NetConnection localhost -Port 5432`
- Check if Redis is running: `Test-NetConnection localhost -Port 6379`
- Check database connection in `.env` file
- Check for error messages in the terminal

### Frontend still shows fetch error

- Verify backend is running: `Test-NetConnection localhost -Port 9000`
- Check `.env.local` has correct `MEDUSA_BACKEND_URL`
- Restart the frontend server
- Clear browser cache

### Missing Publishable Key

1. Start the backend
2. Go to http://localhost:9000/app
3. Create a publishable API key in Settings
4. Add it to `barsell-storefront/.env.local`

## Current Status

- ✅ PostgreSQL: Running
- ❌ Redis: Not running (needs to be started)
- ❌ Backend: Not running (waiting for Redis)
- ✅ Frontend: Running but can't connect to backend

