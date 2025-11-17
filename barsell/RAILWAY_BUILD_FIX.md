# Railway Build Fix Guide

## Common Build Issues and Solutions

### Issue 1: InstantDB Package Not Found

If the build fails with `Cannot find module '@instantdb/admin'`:

**Solution**: The package might not be published yet. You have two options:

#### Option A: Remove InstantDB temporarily (if not critical)
1. Comment out InstantDB imports in the code
2. Make InstantDB features optional
3. Deploy without InstantDB
4. Add InstantDB later when package is available

#### Option B: Install from alternative source
Check if InstantDB has a different package name or installation method.

### Issue 2: Missing Environment Variables During Build

Railway builds without access to environment variables by default.

**Solution**: Make sure environment variables are set in Railway:
1. Go to your service → Variables
2. Add all required variables
3. Redeploy

### Issue 3: Node Version Mismatch

**Solution**: Ensure Node.js 20+ is used:
- Railway should auto-detect from `package.json` engines field
- Or set `NODE_VERSION=20` in Railway variables

### Issue 4: Build Command Fails

**Solution**: Updated `railway.json` to use `npm ci` for clean installs:
```json
{
  "build": {
    "buildCommand": "npm ci && npm run build"
  }
}
```

## Quick Fix Steps

1. **Check Railway Logs**
   - Go to your service → Deployments → Latest → Logs
   - Identify the exact error

2. **Verify Environment Variables**
   - All required vars should be set before build
   - InstantDB vars can be optional if package isn't available

3. **Try Building Locally First**
   ```bash
   cd barsell
   npm ci
   npm run build
   ```

4. **If InstantDB is the issue**, temporarily disable it:
   - The code now handles missing InstantDB gracefully
   - It will throw errors at runtime, not build time

## Updated Configuration

I've updated:
- `railway.json` - Better build command
- `nixpacks.toml` - Explicit Node.js 20 configuration
- InstantDB imports - Now use dynamic requires to avoid build-time errors

## Next Steps

1. Push these changes to GitHub
2. Redeploy on Railway
3. Check build logs for any remaining issues
4. If InstantDB package doesn't exist, consider removing it temporarily

