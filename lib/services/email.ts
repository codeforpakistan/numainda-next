/**
 * Email service for sending monthly digest and transactional emails
 * Using Resend (https://resend.com) as the email provider
 */

interface DigestEmailData {
  email: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeToken?: string;
}

/**
 * Send email via Resend API
 */
export async function sendViaResend(emailData: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured. Using demo mode.");
      // In development, you can still log emails
      console.log("[DEMO MODE] Would send email:", emailData);
      return true;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.SENDER_EMAIL || "noreply@numainda.pk",
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email via Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return false;
  }
}

/**
 * Send digest email to subscriber
 */
export async function sendDigestEmail(
  data: DigestEmailData
): Promise<boolean> {
  return await sendViaResend({
    to: data.email,
    subject: data.subject,
    html: data.html,
    text: data.text,
  });
}

/**
 * Send verification email for new subscriptions
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/verify?token=${verificationToken}`;

  const html = `
    <h2>Verify your Numainda Newsletter Subscription</h2>
    <p>Thank you for subscribing to Numainda's monthly digest!</p>
    <p>Please click the button below to verify your email address:</p>
    <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #1a7f5c; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a></p>
    <p>Or copy and paste this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
    <hr />
    <p><small>If you didn't subscribe to this newsletter, you can safely ignore this email.</small></p>
  `;

  const text = `
Verify your Numainda Newsletter Subscription

Thank you for subscribing to Numainda's monthly digest!

Please verify your email by visiting this link:
${verificationUrl}

If you didn't subscribe to this newsletter, you can safely ignore this email.
  `;

  return await sendDigestEmail({
    email,
    subject: "Verify your Numainda Newsletter Subscription",
    html,
    text,
    unsubscribeToken: verificationToken,
  });
}

/**
 * Send unsubscribe confirmation email
 */
export async function sendUnsubscribeConfirmation(
  email: string
): Promise<boolean> {
  const html = `
    <h2>You've been unsubscribed</h2>
    <p>You have been removed from the Numainda monthly digest mailing list.</p>
    <p>We'll miss you! If you change your mind, you can always subscribe again at:</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Visit Numainda</a></p>
  `;

  const text = `
You've been unsubscribed
You have been removed from the Numainda monthly digest mailing list.
We'll miss you! If you change your mind, you can always subscribe again at:
${process.env.NEXT_PUBLIC_APP_URL}
  `;

  return await sendDigestEmail({
    email,
    subject: "Your Numainda subscription has been cancelled",
    html,
    text,
  });
}
