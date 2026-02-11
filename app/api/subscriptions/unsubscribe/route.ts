import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSubscriptions } from "@/lib/db/schema/email-subscriptions";
import { sendUnsubscribeConfirmation } from "@/lib/services/email";
import { eq } from "drizzle-orm";

/**
 * GET /api/subscriptions/unsubscribe?email=xxx&token=xxx
 * POST /api/subscriptions/unsubscribe?email=xxx
 * Unsubscribe from mailing list
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email) {
      return NextResponse.json(
        { error: "Email address required" },
        { status: 400 }
      );
    }

    // Find subscription
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.email, email.toLowerCase()))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const sub = subscription[0];

    // If token provided, verify it matches (optional security layer)
    if (token && sub.verificationToken !== token) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 403 }
      );
    }

    // Mark as unsubscribed
    await db
      .update(emailSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(emailSubscriptions.id, sub.id));

    // Send confirmation email
    await sendUnsubscribeConfirmation(email);

    // Redirect to confirmation page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?unsubscribed=true`,
      { status: 302 }
    );
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, pehchanId } = body;

    if (!email && !pehchanId) {
      return NextResponse.json(
        { error: "Email or pehchanId required" },
        { status: 400 }
      );
    }

    // Find and update subscription
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(
        pehchanId
          ? eq(emailSubscriptions.pehchanId, pehchanId)
          : eq(emailSubscriptions.email, email.toLowerCase())
      )
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const sub = subscription[0];

    // Mark as unsubscribed
    await db
      .update(emailSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(emailSubscriptions.id, sub.id));

    // Send confirmation email
    await sendUnsubscribeConfirmation(sub.email);

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
