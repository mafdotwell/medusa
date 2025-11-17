# Firebase Integration Setup Guide

This guide explains how to set up Firebase for authentication, storage, and database in the Medusa marketplace application.

## Overview

The application now uses:
- **Firebase Auth**: For user authentication (replacing Medusa's built-in auth)
- **Firebase Storage**: For file uploads (product images, vendor logos, etc.)
- **Firestore**: For custom data storage (complementing PostgreSQL for core Medusa functionality)

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase Admin SDK service account key
3. Firebase web app configuration

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Note your Project ID

### 2. Enable Firebase Services

#### Enable Authentication
1. In Firebase Console, go to **Authentication** > **Get Started**
2. Enable **Email/Password** sign-in method
3. Optionally enable other providers (Google, Facebook, etc.)

#### Enable Storage
1. Go to **Storage** > **Get Started**
2. Start in test mode (or configure security rules)
3. Note your Storage Bucket name

#### Enable Firestore
1. Go to **Firestore Database** > **Create Database**
2. Start in test mode (or configure security rules)
3. Choose a location for your database

### 3. Get Service Account Key (Backend)

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. **Important**: Keep this file secure and never commit it to version control

### 4. Configure Environment Variables

#### Backend (barsell/.env)

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Optional: If using default credentials (Cloud Run, App Engine)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Note**: `FIREBASE_SERVICE_ACCOUNT` should be the entire JSON content as a single-line string, or you can use a file path.

#### Frontend (barsell-storefront/.env.local)

```env
# Firebase Web Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

To get these values:
1. Go to Firebase Console > **Project Settings** > **General**
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Copy the configuration values

### 5. Install Dependencies

```bash
# Backend
cd barsell
npm install

# Frontend
cd barsell-storefront
npm install
```

### 6. Initialize Firebase in Code

Firebase is automatically initialized when the services are first used. The initialization happens in:
- Backend: `src/services/firebase/config.ts`
- Frontend: `src/lib/firebase/config.ts`

## Usage

### Authentication

#### Backend - Verify Token

```typescript
import { verifyFirebaseToken } from "../services/firebase/auth"

const decodedToken = await verifyFirebaseToken(idToken)
```

#### Frontend - Sign In/Up

```typescript
import { getFirebaseAuthClient } from "@/lib/firebase/config"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

const auth = getFirebaseAuthClient()

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password)
const idToken = await userCredential.user.getIdToken()

// Sign up
const userCredential = await createUserWithEmailAndPassword(auth, email, password)
```

### Storage

#### Upload File

```typescript
import { uploadFile } from "../services/firebase/storage"

const result = await uploadFile({
  path: "vendors/vendor-id/products/image.jpg",
  file: buffer,
  contentType: "image/jpeg",
})
```

#### API Endpoint

```bash
POST /vendors/upload
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

file: <file>
folder: "products" (optional)
private: "true" (optional, for private files)
```

### Firestore

#### Create Document

```typescript
import { createDocument } from "../services/firebase/firestore"

await createDocument("vendors", vendorId, {
  name: "Vendor Name",
  email: "vendor@example.com",
})
```

#### Query Documents

```typescript
import { queryDocuments } from "../services/firebase/firestore"

const vendors = await queryDocuments("vendors", [
  { field: "status", operator: "==", value: "active" }
], {
  limit: 10,
  orderBy: { field: "created_at", direction: "desc" }
})
```

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vendors collection
    match /vendors/{vendorId} {
      allow read, write: if request.auth != null && 
        request.auth.token.vendor_id == vendorId;
    }
    
    // Inventory history
    match /inventory_history/{historyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role == "vendor";
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Vendor uploads
    match /vendors/{vendorId}/{allPaths=**} {
      allow read: if true; // Public read for public files
      allow write: if request.auth != null && 
        request.auth.token.vendor_id == vendorId;
    }
  }
}
```

## Custom Claims

To set vendor role and vendor_id for users:

```typescript
import { setCustomUserClaims } from "../services/firebase/auth"

await setCustomUserClaims(uid, {
  role: "vendor",
  vendor_id: "vendor-123",
})
```

## Migration from Medusa Auth

The application now uses Firebase Auth instead of Medusa's built-in authentication. Key changes:

1. **Middleware**: Updated to use `firebaseVendorAuthMiddleware` instead of `authenticate("vendor")`
2. **Token Format**: Uses Firebase ID tokens instead of Medusa JWT tokens
3. **User Management**: Users are managed in Firebase Auth, not Medusa's auth system

## Troubleshooting

### "Firebase configuration missing" Error

- Check that all required environment variables are set
- Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON (if using service account)
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project

### Authentication Fails

- Verify Firebase Auth is enabled in Firebase Console
- Check that the token is being sent in the Authorization header
- Ensure custom claims are set correctly for vendor users

### Storage Upload Fails

- Verify Storage is enabled in Firebase Console
- Check security rules allow writes
- Ensure file size is within limits (default: 10MB)

## Next Steps

1. Set up Firebase security rules for production
2. Configure custom claims for role-based access
3. Set up Firebase Cloud Functions for serverless operations (optional)
4. Configure Firebase Analytics (optional)

