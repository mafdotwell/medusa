# InstantDB Integration Setup Guide

This guide explains how to set up InstantDB for authentication, storage, and database in the Medusa marketplace application.

## Overview

The application now uses:
- **InstantDB Auth**: For user authentication (replacing Firebase Auth)
- **InstantDB Storage**: For file uploads (product images, vendor logos, etc.)
- **InstantDB Database**: For custom data storage (complementing PostgreSQL for core Medusa functionality)

## Prerequisites

1. An InstantDB account created at [InstantDB Dashboard](https://instantdb.com/dash)
2. Your InstantDB App ID: `7f1dce39-2851-4889-b883-a4e4f57aa57b`
3. Admin Token for server-side operations (generate from InstantDB dashboard)

## Setup Steps

### 1. Get InstantDB Credentials

1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Your App ID is already configured: `7f1dce39-2851-4889-b883-a4e4f57aa57b`
3. Generate an Admin Token for server-side operations
4. Note your Admin Token (keep it secure)

### 2. Configure Environment Variables

#### Backend (barsell/.env)

```env
# InstantDB Configuration
INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
INSTANTDB_ADMIN_TOKEN=your-admin-token-here
```

**Important**: Replace `your-admin-token-here` with your actual Admin Token from InstantDB dashboard.

#### Frontend (barsell-storefront/.env.local)

```env
# InstantDB Web Configuration
NEXT_PUBLIC_INSTANTDB_APP_ID=7f1dce39-2851-4889-b883-a4e4f57aa57b
```

### 3. Install Dependencies

```bash
# Backend
cd barsell
npm install

# Frontend
cd barsell-storefront
npm install
```

### 4. Push Schema to InstantDB

After defining your schema in `barsell/instant.schema.ts`, push it to InstantDB:

```bash
cd barsell
npx instant-cli push
```

Or use the InstantDB dashboard to sync your schema.

## Usage

### Authentication

#### Backend - Verify Token

```typescript
import { verifyInstantDBToken } from "../services/instantdb/auth"

const decodedToken = await verifyInstantDBToken(idToken)
```

#### Frontend - Sign In/Up

```typescript
import { db } from "@/lib/instantdb/config"

// Sign in with email
await db.auth.signInWithEmail(email)

// Sign in with magic code
await db.auth.signInWithMagicCode(email)

// Sign in as guest
await db.auth.signInAsGuest()

// Sign out
await db.auth.signOut()
```

### Storage

#### Upload File

```typescript
import { uploadFile } from "../services/instantdb/storage"

const result = await uploadFile({
  path: "vendors/vendor-id/products/image.jpg",
  file: buffer,
  contentType: "image/jpeg",
  metadata: {
    vendor_id: "vendor-123",
    original_name: "product.jpg",
    uploaded_by: "user-id",
  },
})
```

#### API Endpoint

```bash
POST /vendors/upload
Authorization: Bearer <instantdb-token>
Content-Type: multipart/form-data

file: <file>
folder: "products" (optional)
private: "true" (optional, for private files)
```

### Database

#### Create Document

```typescript
import { createDocument } from "../services/instantdb/database"

await createDocument("vendors", {
  name: "Vendor Name",
  email: "vendor@example.com",
})
```

#### Query Documents

```typescript
import { queryDocuments } from "../services/instantdb/database"

const vendors = await queryDocuments("vendors", {
  where: { status: "active" },
  limit: 10,
  orderBy: { field: "created_at", direction: "desc" },
})
```

## Schema

The InstantDB schema is defined in `barsell/instant.schema.ts` and includes:

- **vendors**: Vendor entities
- **vendor_admins**: Vendor admin users
- **files**: File upload metadata

## Migration from Firebase

The application now uses InstantDB instead of Firebase. Key changes:

1. **Middleware**: Updated to use `instantdbVendorAuthMiddleware` instead of `firebaseVendorAuthMiddleware`
2. **Token Format**: Uses InstantDB tokens instead of Firebase ID tokens
3. **User Management**: Users are managed in InstantDB, not Firebase Auth
4. **Storage**: Files are stored via InstantDB Storage API
5. **Database**: Custom data uses InstantDB instead of Firestore

## Troubleshooting

### "InstantDB configuration missing" Error

- Check that `INSTANTDB_APP_ID` is set in backend `.env`
- Verify `INSTANTDB_ADMIN_TOKEN` is set for server-side operations
- Ensure `NEXT_PUBLIC_INSTANTDB_APP_ID` is set in frontend `.env.local`

### Authentication Fails

- Verify InstantDB Auth is configured in InstantDB dashboard
- Check that the token is being sent in the Authorization header
- Ensure user has proper permissions/roles set in InstantDB

### Storage Upload Fails

- Verify InstantDB Storage is enabled
- Check file size limits (default: 10MB)
- Ensure proper permissions are set

## Next Steps

1. Generate Admin Token from InstantDB dashboard
2. Set environment variables in both backend and frontend
3. Push schema to InstantDB using CLI or dashboard
4. Test authentication flow
5. Test file upload functionality
6. Configure permissions in InstantDB dashboard

## Files Created/Modified

### New Files:
- `barsell/instant.schema.ts` - InstantDB schema definition
- `barsell/src/services/instantdb/config.ts` - InstantDB initialization
- `barsell/src/services/instantdb/auth.ts` - Authentication functions
- `barsell/src/services/instantdb/storage.ts` - File storage functions
- `barsell/src/services/instantdb/database.ts` - Database operations
- `barsell/src/middlewares/instantdb-auth.ts` - Auth middleware
- `barsell-storefront/src/lib/instantdb/config.ts` - Frontend config

### Modified Files:
- `barsell/src/api/middlewares.ts` - Updated to use InstantDB middleware
- `barsell/src/api/vendors/upload/route.ts` - Updated to use InstantDB storage
- `barsell/package.json` - Removed Firebase, added InstantDB
- `barsell-storefront/package.json` - Removed Firebase, added InstantDB

## Notes

- The implementation uses InstantDB's Admin SDK for server-side operations
- Client-side uses InstantDB React SDK
- All endpoints respect vendor boundaries and only return data for the authenticated vendor
- The system is designed to work with InstantDB's real-time capabilities

