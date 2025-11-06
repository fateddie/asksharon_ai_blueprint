# Gmail IMAP Setup Guide

## Overview

AskSharon.ai connects to your Gmail account using IMAP (Internet Message Access Protocol) to fetch and analyze your emails. This guide walks you through the setup process.

---

## Prerequisites

- A Gmail account
- Two-factor authentication (2FA) enabled on your Google account
- Python virtual environment activated

---

## Step 1: Enable Two-Factor Authentication

Gmail app passwords require 2FA to be enabled.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Follow the prompts to enable 2FA using your phone
4. Verify 2FA is working by signing out and back in

---

## Step 2: Generate App Password

An "App Password" is a 16-character code that allows AskSharon.ai to access your Gmail without exposing your main password.

### Instructions:

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Sign in with your Google account
3. Select **Mail** from the "Select app" dropdown
4. Select **Other (Custom name)** from the "Select device" dropdown
5. Enter: `AskSharon.ai`
6. Click **Generate**
7. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
8. **Copy this password immediately** - you won't be able to see it again

---

## Step 3: Configure AskSharon.ai

### Copy Environment Template

```bash
cp .env.example .env
```

### Edit `.env` File

Open `.env` in your text editor and update these fields:

```bash
# Gmail Configuration (Phase 2 - Week 1)
GMAIL_EMAIL=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop  # Remove spaces from the 16-char password
GMAIL_IMAP_SERVER=imap.gmail.com
GMAIL_IMAP_PORT=993
GMAIL_FETCH_LIMIT=100
GMAIL_SYNC_INTERVAL=300
```

**Important:**
- Replace `your-actual-email@gmail.com` with your real Gmail address
- Replace the app password with the 16-character code (remove spaces)
- Keep `GMAIL_IMAP_SERVER` as `imap.gmail.com`
- Keep `GMAIL_IMAP_PORT` as `993` (secure IMAP)

### Optional Configuration

- `GMAIL_FETCH_LIMIT`: Number of recent emails to fetch (default: 100)
- `GMAIL_SYNC_INTERVAL`: Seconds between email syncs (default: 300 = 5 minutes)

---

## Step 4: Test Connection

Run the connection test script:

```bash
python scripts/test_gmail_connection.py
```

### Expected Output (Success):

```
✓ Gmail credentials found in .env
✓ Connected to imap.gmail.com:993
✓ Authenticated as your-email@gmail.com
✓ INBOX selected
✓ Found 1,234 emails in INBOX
✓ Successfully fetched latest email:
  Subject: Team Meeting Notes
  From: Sarah Chen <sarah@example.com>
  Date: 2025-11-06 14:30:00

✅ Gmail IMAP connection successful!
```

### Expected Output (Failure):

```
❌ Gmail credentials not found in .env
```

or

```
❌ Authentication failed: Invalid credentials
Check your GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env
```

---

## Step 5: Enable Email Sync

Update `.env` to enable email synchronization:

```bash
# Feature Flags (Phase 1 MVP)
ENABLE_VOICE=false
ENABLE_EMAIL_SYNC=true  # Change this to true
ENABLE_CALENDAR_SYNC=false
```

---

## Troubleshooting

### Problem: "Invalid credentials" error

**Cause:** App password is incorrect or has spaces

**Solution:**
1. Verify you copied the 16-character password correctly
2. Remove any spaces from the password
3. Regenerate a new app password if needed

### Problem: "IMAP access disabled" error

**Cause:** IMAP is disabled in Gmail settings

**Solution:**
1. Go to [Gmail Settings](https://mail.google.com/mail/u/0/#settings/fwdandpop)
2. Click **Forwarding and POP/IMAP** tab
3. Under "IMAP access", select **Enable IMAP**
4. Click **Save Changes**

### Problem: "Two-factor authentication not enabled"

**Cause:** You need 2FA enabled to create app passwords

**Solution:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Then generate app password

### Problem: "Connection timed out"

**Cause:** Network firewall or proxy blocking IMAP port 993

**Solution:**
1. Check your firewall allows outbound connections on port 993
2. If using corporate network, contact IT department
3. Try from a different network (e.g., home WiFi vs. work)

### Problem: "Too many login attempts"

**Cause:** Gmail rate limiting after multiple failed attempts

**Solution:**
1. Wait 15 minutes before retrying
2. Verify credentials are correct
3. Check [Recent Security Events](https://myaccount.google.com/notifications)

---

## Security Best Practices

### 1. Protect Your App Password

- Never commit `.env` to version control (already in `.gitignore`)
- Don't share your app password with anyone
- Regenerate app password if compromised

### 2. Revoke Unused App Passwords

Periodically review and remove old app passwords:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Scroll to **App passwords**
4. Click **Revoke** on unused passwords

### 3. Monitor Account Activity

Check [Recent Security Activity](https://myaccount.google.com/notifications) regularly for suspicious logins.

---

## Gmail Quota Limits

Gmail IMAP has usage quotas to prevent abuse:

- **Download limit:** 2,500 MB per day
- **Upload limit:** 500 MB per day
- **Commands per second:** 10 commands/second

AskSharon.ai stays well within these limits by:
- Caching fetched emails locally
- Only fetching new emails after initial sync
- Rate limiting API calls

---

## Testing Different Email Types

After setup, test with various email types:

1. **Work emails** - Should be marked HIGH priority
2. **Personal emails** - Should be marked MEDIUM priority
3. **Marketing emails** - Should be marked LOW priority
4. **Emails with attachments** - Attachment count should show
5. **HTML emails** - Should parse correctly
6. **Plain text emails** - Should parse correctly

---

## Next Steps

Once Gmail is connected:

1. Ask Sharon: `"Check my email"`
2. Review the AI-generated summaries
3. Verify priority detection is working
4. Check action items are identified

---

## Support

If you encounter issues not covered here:

1. Check logs: `logs/app.log`
2. Run health check: `python scripts/health_check.py`
3. Review [Error Handling Guide](ERROR_HANDLING_GUIDE.md)
4. Open an issue with detailed error messages

---

## References

- [Gmail IMAP Documentation](https://support.google.com/mail/answer/7126229)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [IMAP Protocol Specification](https://tools.ietf.org/html/rfc3501)
