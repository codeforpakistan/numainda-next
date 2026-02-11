# Monthly Email Digest Subscription Feature

This document outlines the implementation of the monthly email digest subscription feature for Numainda.

## Overview

The feature allows users to subscribe to a monthly digest of parliamentary updates via email. Users can subscribe in two ways:

1. **Email Signup**: Anyone can subscribe with just an email address (requires verification)
2. **Pehchan Login Integration**: Authenticated users get automatic subscription without needing verification

## Component Architecture

### Database Schema
- **`email_subscriptions` table**: Stores all subscription information including:
  - Email address
  - Optional Pehchan ID for authenticated users
  - Subscription preferences (bills, proceedings, representatives)
  - Verification status
  - Geographic filters (constituency, province)

### Services

#### Email Service (`lib/services/email.ts`)
- `sendDigestEmail()` - Main method to send emails
- `sendVerificationEmail()` - Send verification links to new subscribers
- `sendUnsubscribeConfirmation()` - Confirmation email after unsubscribing
- Uses Resend API for reliable email delivery

#### Digest Service (`lib/services/digest.ts`)
- `getRecentBills()` - Fetch bills from past 30 days
- `getRecentProceedings()` - Fetch parliamentary proceedings
- `getNewRepresentatives()` - Fetch new/updated representatives
- `generateDigestHTML()` - Create HTML email template
- `generateDigestText()` - Create plain text fallback

### API Routes

#### Subscription Management
- **POST `/api/subscriptions`** - Create new subscription
- **GET `/api/subscriptions`** - List all active subscriptions (admin)
- **GET `/api/subscriptions/verify?token=xxx`** - Verify email
- **GET/POST `/api/subscriptions/unsubscribe`** - Unsubscribe
- **GET/PUT/DELETE `/api/subscriptions/[id]`** - Manage individual subscription preferences

#### Digest Sending
- **POST `/api/digests/send`** - Send monthly digest to all subscribers
  - Secured with `QSTASH_TOKEN` or `ADMIN_PASSWORD`
  - Returns count of sent/failed emails
- **GET `/api/digests/send`** - Get digest statistics

## Setup & Configuration

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Beehive Configuration (if using self-hosted Beehive)
BEEHIVE_API_URL=https://your-beehive-instance.com
BEEHIVE_API_TOKEN=your-beehive-token

# Or use Resend for email sending
RESEND_API_KEY=re_your_resend_api_key

# Sender email (required)
SENDER_EMAIL=noreply@numainda.pk

# Upstash QStash for scheduled sends
QSTASH_TOKEN=your_qstash_token

# Admin features
ADMIN_PASSWORD=your_admin_password
```

### 2. Database Migration

Run the database migration to create the email_subscriptions table:

```bash
npm run db:generate
npm run db:migrate
```

### 3. Email Service Setup

Choose one of the following options:

#### Option A: Using Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`: `RESEND_API_KEY=re_xxx`
4. Update `SENDER_EMAIL` to your verified domain email

#### Option B: Using Beehive
1. Set up a self-hosted Beehive instance
2. Configure API access
3. Add `BEEHIVE_API_URL` and `BEEHIVE_API_TOKEN` to `.env.local`

### 4. Schedule Digest Sends with Upstash QStash

1. Create an Upstash account: [upstash.com](https://upstash.com)
2. Create a QStash token
3. Add the token to `.env.local`: `QSTASH_TOKEN=xxx`

4. Create a scheduled job via QStash:
```bash
curl -X POST https://qstash.io/v2/schedules/ \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/digests/send",
    "cron": "0 0 1 * *",
    "method": "POST",
    "header": {
      "Authorization": "Bearer YOUR_QSTASH_TOKEN"
    }
  }'
```

This creates a cron job that runs at **00:00 UTC on the 1st of each month**.

Alternatively, you can use Upstash's web console to create the schedule.

## UI Components

### EmailSubscriptionForm
Location: `components/email-subscription-form.tsx`

Allows users to subscribe with email or Pehchan login:
```tsx
<EmailSubscriptionForm pehchanId={id} userName={name} />
```

### SubscriptionPreferencesManager
Location: `components/subscription-preferences-manager.tsx`

Allows users to manage their subscription preferences:
```tsx
<SubscriptionPreferencesManager subscriptionId={subscriptionId} />
```

## Pages

### Subscription Settings
Location: `/settings/subscriptions`

Complete subscription management interface where users can:
- Subscribe to the digest
- Manage preferences (what content to include)
- Unsubscribe

## Usage Examples

### Subscribe a User
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "includeBills": true,
    "includeProceedings": true,
    "includeRepresentatives": true
  }'
```

### Subscribe Pehchan User
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "pehchanId": "12345-67890-12345",
    "includeBills": true,
    "includeProceedings": true,
    "includeRepresentatives": true
  }'
```

### Manually Trigger Digest Send (Dev/Admin)
```bash
curl -X POST http://localhost:3000/api/digests/send \
  -H "Content-Type: application/json" \
  -d '{
    "adminPassword": "YOUR_ADMIN_PASSWORD"
  }'
```

Or with QStash token:
```bash
curl -X POST http://localhost:3000/api/digests/send \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN"
```

### Get Subscription Preferences
```bash
curl http://localhost:3000/api/subscriptions/sub_xxx
```

### Update Preferences
```bash
curl -X PUT http://localhost:3000/api/subscriptions/sub_xxx \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "includeBills": false,
    "includeProceedings": true,
    "includeRepresentatives": true
  }'
```

## Email Template

The digest email includes:
- **Header** with month and year
- **Bills section** - Latest bills with summaries and links
- **Proceedings section** - Parliamentary proceedings updates
- **Representatives section** - New/updated representative information
- **Footer** - Unsubscribe links and privacy notice

Users can customize which sections appear based on their preferences.

## Security Considerations

1. **Email Verification**: Email signups require verification via token
2. **Pehchan Integration**: Leverages existing OAuth authentication
3. **Unsubscribe Tokens**: Included in emails for one-click unsubscribe
4. **API Authorization**: Digest send endpoint requires QSTASH_TOKEN or ADMIN_PASSWORD
5. **Rate Limiting**: Consider adding rate limiting to subscription endpoints

## Future Enhancements

1. **Frequency Options**: Allow daily, weekly, or custom digest schedules
2. **Geographic Filtering**: Filter by constituency or province
3. **Representative Tracking**: Get updates only for specific representatives
4. **Digest Archives**: Allow users to view past digests
5. **Engagement Analytics**: Track open rates, click rates via email service
6. **A/B Testing**: Test different subject lines and templates
7. **Segmentation**: Send different content based on user interests
8. **Multi-language**: Support Urdu, Punjabi, etc.

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` or `BEEHIVE_API_URL` is configured
2. Verify `SENDER_EMAIL` is valid and verified
3. Check server logs for error messages
4. Test with `/api/digests/send` manually

### Digest Not Sending on Schedule
1. Verify QStash cron job is configured correctly
2. Check QStash console for failed deliveries
3. Verify endpoint is publicly accessible
4. Check Authorization header matches QSTASH_TOKEN

### Verification Email Not Received
1. Check RESEND_API_KEY is correct
2. Verify sender email is verified in email service
3. Check spam folder
4. Review email service delivery logs

## References

- [Resend Email API](https://resend.com/docs)
- [Upstash QStash](https://upstash.com/docs/qstash/)
- [Beehive Newsletter](https://mattermost.com/beehive/)
- [Drizzle ORM](https://orm.drizzle.team/)
