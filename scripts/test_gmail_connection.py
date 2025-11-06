#!/usr/bin/env python3
"""
Gmail IMAP Connection Test Script

Tests the Gmail IMAP configuration and verifies connection.
Run this after setting up your Gmail app password in .env

Usage:
    python scripts/test_gmail_connection.py
"""

import os
import sys
import imaplib
import email
from email.header import decode_header
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def load_env():
    """Load environment variables from .env file"""
    env_path = project_root / ".env"
    if not env_path.exists():
        return {}

    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
    return env_vars

def print_step(emoji: str, message: str, status: str = ""):
    """Print a test step with formatting"""
    if status == "success":
        print(f"{emoji} {message}")
    elif status == "error":
        print(f"❌ {message}")
    else:
        print(f"{emoji} {message}")

def decode_email_header(header_value):
    """Decode email header (handles UTF-8 encoding)"""
    if header_value is None:
        return ""

    decoded_parts = decode_header(header_value)
    decoded_str = ""

    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            decoded_str += part.decode(encoding or 'utf-8', errors='ignore')
        else:
            decoded_str += part

    return decoded_str

def test_connection():
    """Test Gmail IMAP connection"""
    print("\n" + "="*60)
    print("Gmail IMAP Connection Test")
    print("="*60 + "\n")

    # Step 1: Load credentials
    print_step("🔍", "Checking credentials...", "")
    env_vars = load_env()

    gmail_email = env_vars.get('GMAIL_EMAIL', '')
    gmail_password = env_vars.get('GMAIL_APP_PASSWORD', '')
    gmail_server = env_vars.get('GMAIL_IMAP_SERVER', 'imap.gmail.com')
    gmail_port = int(env_vars.get('GMAIL_IMAP_PORT', '993'))

    if not gmail_email or gmail_email.startswith('your-'):
        print_step("❌", "GMAIL_EMAIL not configured in .env", "error")
        print("   → Edit .env and set GMAIL_EMAIL=your-email@gmail.com")
        return False

    if not gmail_password or gmail_password.startswith('your-'):
        print_step("❌", "GMAIL_APP_PASSWORD not configured in .env", "error")
        print("   → See docs/GMAIL_SETUP.md for instructions")
        return False

    print_step("✓", "Gmail credentials found in .env", "success")
    print(f"   Email: {gmail_email}")
    print(f"   Server: {gmail_server}:{gmail_port}")

    # Step 2: Connect to IMAP server
    print_step("\n🔌", "Connecting to IMAP server...", "")
    try:
        mail = imaplib.IMAP4_SSL(gmail_server, gmail_port)
        print_step("✓", f"Connected to {gmail_server}:{gmail_port}", "success")
    except Exception as e:
        print_step("❌", f"Connection failed: {e}", "error")
        print("   → Check your internet connection")
        print("   → Verify firewall allows port 993")
        return False

    # Step 3: Authenticate
    print_step("\n🔐", "Authenticating...", "")
    try:
        mail.login(gmail_email, gmail_password)
        print_step("✓", f"Authenticated as {gmail_email}", "success")
    except imaplib.IMAP4.error as e:
        print_step("❌", f"Authentication failed: {e}", "error")
        print("   → Verify GMAIL_APP_PASSWORD in .env is correct")
        print("   → Check that 2FA is enabled on your Google account")
        print("   → Try regenerating the app password")
        print("   → See docs/GMAIL_SETUP.md for setup instructions")
        return False
    except Exception as e:
        print_step("❌", f"Unexpected error: {e}", "error")
        return False

    # Step 4: Select INBOX
    print_step("\n📬", "Selecting INBOX...", "")
    try:
        status, messages = mail.select("INBOX")
        if status != "OK":
            print_step("❌", f"Failed to select INBOX: {messages}", "error")
            return False

        email_count = int(messages[0].decode())
        print_step("✓", "INBOX selected", "success")
        print_step("✓", f"Found {email_count} emails in INBOX", "success")
    except Exception as e:
        print_step("❌", f"Error selecting INBOX: {e}", "error")
        return False

    # Step 5: Fetch latest email
    print_step("\n📧", "Fetching latest email...", "")
    try:
        if email_count == 0:
            print_step("⚠️", "No emails found in INBOX", "")
            print("   → This is normal for a new Gmail account")
        else:
            # Search for all emails
            status, message_ids = mail.search(None, "ALL")
            if status != "OK":
                print_step("❌", f"Search failed: {message_ids}", "error")
                return False

            # Get the latest email ID
            email_ids = message_ids[0].split()
            latest_email_id = email_ids[-1]

            # Fetch the email
            status, msg_data = mail.fetch(latest_email_id, "(RFC822)")
            if status != "OK":
                print_step("❌", f"Fetch failed: {msg_data}", "error")
                return False

            # Parse email
            email_body = msg_data[0][1]
            msg = email.message_from_bytes(email_body)

            subject = decode_email_header(msg.get("Subject", ""))
            from_header = decode_email_header(msg.get("From", ""))
            date_str = msg.get("Date", "")

            print_step("✓", "Successfully fetched latest email:", "success")
            print(f"   Subject: {subject[:60]}{'...' if len(subject) > 60 else ''}")
            print(f"   From: {from_header[:60]}{'...' if len(from_header) > 60 else ''}")
            print(f"   Date: {date_str}")
    except Exception as e:
        print_step("❌", f"Error fetching email: {e}", "error")
        print("   → This is not critical, authentication worked")

    # Step 6: Logout
    try:
        mail.logout()
    except:
        pass

    # Success summary
    print("\n" + "="*60)
    print_step("✅", "Gmail IMAP connection successful!", "success")
    print("="*60)
    print("\nNext steps:")
    print("1. Enable email sync in .env: ENABLE_EMAIL_SYNC=true")
    print("2. Restart the application: ./scripts/start.sh")
    print("3. Ask Sharon: 'Check my email'")
    print("\n")

    return True

if __name__ == "__main__":
    try:
        success = test_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
