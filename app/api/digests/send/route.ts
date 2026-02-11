import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSubscriptions } from "@/lib/db/schema/email-subscriptions";
import { sendDigestEmail } from "@/lib/services/email";
import {
  getRecentBills,
  getRecentProceedings,
  getNewRepresentatives,
  generateDigestHTML,
  generateDigestText,
} from "@/lib/services/digest";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/digests/send
 * Send monthly digest to all active subscribers
 * This endpoint should be called by Upstash QStash on the 1st of each month
 * Requires QSTASH_TOKEN for authentication
 */
export async function POST(request: Request) {
  try {
    // Verify Upstash token for security
    const authHeader = request.headers.get("Authorization");
    const qstashToken = process.env.QSTASH_TOKEN;

    if (!qstashToken || authHeader !== `Bearer ${qstashToken}`) {
      // Also accept admin password as fallback
      const body = await request.json().catch(() => null);
      if (!body?.adminPassword || body.adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("Starting monthly digest send...");

    // Get all active, verified subscriptions
    const subscribers = await db
      .select()
      .from(emailSubscriptions)
      .where(
        and(
          eq(emailSubscriptions.isActive, true),
          eq(emailSubscriptions.isVerified, true)
        )
      );

    console.log(`Found ${subscribers.length} active subscribers`);

    if (subscribers.length === 0) {
      return NextResponse.json({
        message: "No active subscribers to send to",
        sent: 0,
        failed: 0,
      });
    }

    // Get digest content
    const recentBills = await getRecentBills(30);
    const recentProceedings = await getRecentProceedings(30);
    const newRepresentatives = await getNewRepresentatives(30);

    console.log(
      `Digest content: ${recentBills.length} bills, ${recentProceedings.length} proceedings, ${newRepresentatives.length} reps`
    );

    // Send digest to each subscriber
    let sentCount = 0;
    let failedCount = 0;
    const errors: { email: string; error: string }[] = [];

    for (const subscriber of subscribers) {
      try {
        const digestContent = {
          bills: recentBills,
          proceedings: recentProceedings,
          representatives: newRepresentatives,
        };

        const preferences = {
          includeBills: subscriber.includeBills,
          includeProceedings: subscriber.includeProceedings,
          includeRepresentatives: subscriber.includeRepresentatives,
        };

        const htmlContent = generateDigestHTML(digestContent, preferences);
        const textContent = generateDigestText(digestContent, preferences);

        const success = await sendDigestEmail({
          email: subscriber.email,
          subject: `Numainda Monthly Digest - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          html: htmlContent,
          text: textContent,
        });

        if (success) {
          sentCount++;

          // Update last sent timestamp
          await db
            .update(emailSubscriptions)
            .set({
              lastDigestSentAt: new Date(),
            })
            .where(eq(emailSubscriptions.id, subscriber.id));
        } else {
          failedCount++;
          errors.push({
            email: subscriber.email,
            error: "Failed to send email",
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          email: subscriber.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `Digest send complete: ${sentCount} sent, ${failedCount} failed`
    );

    return NextResponse.json({
      message: "Monthly digest sent",
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending digest:", error);
    return NextResponse.json(
      {
        error: "Failed to send digest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/digests/send
 * Check digest send status (admin use)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stats about last digest send
    const subscribers = await db
      .select()
      .from(emailSubscriptions)
      .where(
        and(
          eq(emailSubscriptions.isActive, true),
          eq(emailSubscriptions.isVerified, true)
        )
      );

    const lastSent = subscribers
      .map((s) => s.lastDigestSentAt)
      .filter((date) => date !== null)
      .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

    return NextResponse.json({
      activeSubscribers: subscribers.length,
      lastDigestSent: lastSent,
      nextDigestScheduled: calculateNextMonthlyDigestDate(),
    });
  } catch (error) {
    console.error("Error getting digest status:", error);
    return NextResponse.json(
      { error: "Failed to get digest status" },
      { status: 500 }
    );
  }
}

/**
 * Calculate when the next monthly digest should be sent (1st of month)
 */
function calculateNextMonthlyDigestDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth;
}
