# 🔧 Google OAuth Setup Guide

## The Issue
You're seeing a 400 error from Google because the OAuth credentials haven't been configured yet. The app is using placeholder values.

## Quick Fix Steps

### 1. **Go to Google Cloud Console**
Open: https://console.cloud.google.com/

### 2. **Create or Select Project**
- Click "Select a project" at the top
- Either create a new project or use an existing one
- Name it something like "Personal Assistant"

### 3. **Enable Required APIs**
Go to "APIs & Services" → "Library" and enable:
- Gmail API
- Google Calendar API
- Google+ API (for profile info)

### 4. **Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External (for personal use)
   - App name: "Personal Assistant"
   - User support email: your email
   - Scopes: Add Gmail and Calendar scopes
4. Choose "Web application" as application type
5. Add these Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### 5. **Copy Your Credentials**
After creating the OAuth client, you'll get:
- Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
- Client Secret (looks like: `GOCSPX-abcdefghijklmnop`)

### 6. **Update Environment Variables**
Replace these lines in your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

### 7. **Restart Development Server**
```bash
npm run dev
```

## Quick Copy-Paste Template

After getting your credentials from Google Cloud Console, update `.env.local`:

```bash
# Replace with your actual values:
GOOGLE_CLIENT_ID=123456789-yourproject.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-yourActualSecretHere
```

## Testing
1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Connect Google Account"
4. You should be redirected to Google's real OAuth screen

## Common Issues
- **400 Error**: Wrong redirect URI - make sure it's exactly `http://localhost:3000/api/auth/callback/google`
- **403 Error**: APIs not enabled - enable Gmail API and Calendar API
- **Consent Screen**: You may need to add test users if the app isn't published

## OAuth Consent Screen Settings
- **App name**: Personal Assistant
- **User support email**: Your email
- **App domain**: Leave blank for testing
- **Scopes**:
  - `../auth/userinfo.email`
  - `../auth/userinfo.profile`
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`

Once set up, your Google account connection will work perfectly! 🎉