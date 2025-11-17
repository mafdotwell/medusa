# Railway Build Troubleshooting

## Error: "Error creating build plan with Railpack"

This error means Railway's Nixpacks builder can't detect how to build your project.

### Solution 1: Check Root Directory

**In Railway Dashboard:**
1. Go to your service → Settings
2. Check **Root Directory** is set to: `barsell`
3. If not, set it and redeploy

### Solution 2: Use Railway's Auto-Detection

Railway should auto-detect Node.js projects. If it doesn't:

1. **Remove custom build commands** - Let Railway auto-detect
2. **Ensure `package.json` is in the root directory** (`barsell/package.json`)
3. **Check Node version** - Should be 20+ (set in `package.json` engines)

### Solution 3: Manual Build Configuration

If auto-detection fails, Railway will use:
- `nixpacks.toml` (if present)
- `railway.json` (if present)
- Default Node.js detection

### Solution 4: Check Package.json

Ensure your `package.json` has:
- ✅ `"engines": { "node": ">=20" }`
- ✅ Valid `build` script: `"build": "medusa build"`
- ✅ Valid `start` script: `"start": "medusa start"`

### Solution 5: Try Dockerfile (Alternative)

If Nixpacks continues to fail, create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

EXPOSE 9000

CMD ["npm", "start"]
```

Then in Railway:
- Settings → Build → Builder → **Dockerfile**

## Quick Fix Checklist

- [ ] Root Directory set to `barsell` in Railway
- [ ] `package.json` exists in `barsell/` directory
- [ ] Node version specified (>=20)
- [ ] Build and start scripts are valid
- [ ] Environment variables are set
- [ ] No syntax errors in config files

## Still Not Working?

1. **Check Railway Logs**:
   - Go to Deployments → Latest → Logs
   - Look for specific error messages

2. **Try Manual Deploy**:
   - Delete the service
   - Create new service
   - Set Root Directory: `barsell`
   - Deploy again

3. **Contact Railway Support**:
   - Share the error logs
   - They can help debug Nixpacks issues

