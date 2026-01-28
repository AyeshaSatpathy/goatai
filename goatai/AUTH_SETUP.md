# Authentication Setup Guide

This project uses Better-Auth for authentication with Google OAuth.

## Prerequisites

1. Node.js and npm installed
2. A Google Cloud Project with OAuth credentials

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 2. Set Up Database

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App URL (for production, update this)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret to your `.env.local` file

### 5. Generate a Secret Key

Generate a secure random string for `BETTER_AUTH_SECRET`:

```bash
# Using openssl
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 6. Run the Application

```bash
npm run dev
```

## Testing Authentication

1. Click "Sign Up" or "Log In" in the header
2. Click "Sign in with Google"
3. You'll be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to the app
5. Your profile should appear in the header

## Troubleshooting

- **Database errors**: Make sure you've run `npx prisma migrate dev`
- **OAuth errors**: Verify your Google OAuth credentials and redirect URIs
- **Session not persisting**: Check that `BETTER_AUTH_SECRET` is set correctly

