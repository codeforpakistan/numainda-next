# Newsletter Feature Guide

This guide explains how to set up and use the Numainda newsletter/digest feature.

## Overview

The newsletter feature allows users to subscribe to monthly digest emails containing:
- Recent bills and legislative updates
- Parliamentary proceedings
- New representative information

## Prerequisites

### 1. Resend Account Setup

The newsletter uses [Resend](https://resend.com) as the email provider.

1. Create an account at https://resend.com
2. Get your API key from the dashboard
3. **Important**: Verify a domain at https://resend.com/domains to send emails to any address

> **Note**: Without domain verification, you can only send test emails to your own registered email address.

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Required
RESEND_API_KEY="re_your_api_key_here"

# Optional (defaults shown)
SENDER_EMAIL="noreply@yourdomain.com"  # Must match your verified domain
NEXT_PUBLIC_APP_URL="https://numainda.codeforpakistan.org"

# For scheduled digest sending via QStash
QSTASH_TOKEN="your_qstash_token"
ADMIN_PASSWORD="your_admin_password"
```

### 3. Database

Ensure PostgreSQL is running with the `email_subscriptions` table:

```bash
# Start the database (if using Docker)
docker start numainda-postgres

# Run migrations if needed
npm run db:push
```

## API Endpoints

### Create Subscription

```bash
POST /api/subscriptions
Content-Type: application/json

{
  "email": "user@example.com",
  "pehchanId": "optional-pehchan-id",      # Auto-verifies if provided
  "constituencyCode": "NA-1",               # Optional
  "province": "Punjab"                      # Optional
}
```

**Response:**
```json
{
  "message": "Subscription created. Please verify your email.",
  "subscriptionId": "abc123",
  "verificationRequired": true
}
```

### Verify Email

Users click the verification link in their email, which calls:

```bash
GET /api/subscriptions/verify?token=verification_token
```

This redirects to `/?verified=true` on success.

### Update Subscription Preferences

```bash
PATCH /api/subscriptions/[id]
Content-Type: application/json

{
  "includeBills": true,
  "includeProceedings": true,
  "includeRepresentatives": false
}
```

### Unsubscribe

```bash
POST /api/subscriptions/unsubscribe
Content-Type: application/json

{
  "token": "unsubscribe_token"
}
```

### Send Monthly Digest (Admin/Cron)

```bash
POST /api/digests/send
Authorization: Bearer your_qstash_token

# Or with admin password
{
  "adminPassword": "your_admin_password"
}
```

## Testing the Feature

### 1. Test Subscription (Development)

```bash
# Start the dev server
npm run dev

# Create a test subscription (use your Resend-registered email)
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"email": "your-registered-email@domain.com"}'
```

### 2. Test Email Script

```bash
# Run the test script
./scripts/test-email-subscriptions.sh
```

### 3. Manual Digest Send

```bash
curl -X POST http://localhost:3000/api/digests/send \
  -H "Content-Type: application/json" \
  -d '{"adminPassword": "your_admin_password"}'
```

## User Flow

1. **Subscribe**: User enters email on the website
2. **Verify**: User receives verification email and clicks the link
3. **Confirmed**: Subscription is now active
4. **Monthly Digest**: On the 1st of each month, digest emails are sent
5. **Unsubscribe**: User can click unsubscribe link in any digest email

## Scheduled Sending (Production)

Set up a cron job or use Upstash QStash to call the digest endpoint monthly:

### Using QStash

1. Create a schedule at https://console.upstash.com/qstash
2. Set the endpoint: `https://yourdomain.com/api/digests/send`
3. Set schedule: `0 9 1 * *` (9 AM on the 1st of each month)
4. Add header: `Authorization: Bearer your_qstash_token`

## File Structure

```
lib/
├── services/
│   ├── email.ts          # Email sending functions (Resend integration)
│   └── digest.ts         # Digest content generation
├── db/
│   └── schema/
│       └── email-subscriptions.ts  # Database schema

app/api/
├── subscriptions/
│   ├── route.ts          # POST (create), GET (list)
│   ├── [id]/
│   │   └── route.ts      # PATCH (update), DELETE
│   ├── verify/
│   │   └── route.ts      # GET (verify email)
│   └── unsubscribe/
│       └── route.ts      # POST (unsubscribe)
└── digests/
    └── send/
        └── route.ts      # POST (send monthly digest)

components/
├── email-subscription-form.tsx           # Subscription form UI
└── subscription-preferences-manager.tsx  # Preferences management UI
```

## Troubleshooting

### "You can only send testing emails to your own email address"

**Cause**: Resend domain not verified.

**Solution**: 
- Verify a domain at https://resend.com/domains
- Or use your registered Resend email for testing

### "ECONNREFUSED" or Database Errors

**Cause**: PostgreSQL not running.

**Solution**:
```bash
docker start numainda-postgres
```

### "RESEND_API_KEY not configured"

**Cause**: Missing environment variable.

**Solution**: Add `RESEND_API_KEY` to your `.env` file.

### Emails Not Arriving

1. Check Resend dashboard for delivery status
2. Verify the `SENDER_EMAIL` matches your verified domain
3. Check spam folder
4. Ensure `isVerified: true` for the subscription in the database

### Check Subscription Status

```sql
SELECT * FROM email_subscriptions WHERE email = 'user@example.com';
```

## Database Schema

```sql
CREATE TABLE email_subscriptions (
  id VARCHAR(191) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  pehchan_id VARCHAR(50),
  constituency_code VARCHAR(20),
  province VARCHAR(100),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_token TEXT,
  unsubscribe_token TEXT,
  include_bills BOOLEAN DEFAULT true,
  include_proceedings BOOLEAN DEFAULT true,
  include_representatives BOOLEAN DEFAULT true,
  last_digest_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Production Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] `SENDER_EMAIL` set to verified domain email
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] QStash schedule configured for monthly digest
- [ ] Database migrations run
- [ ] Test subscription flow end-to-end
