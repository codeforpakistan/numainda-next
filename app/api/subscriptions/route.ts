import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSubscriptions } from "@/lib/db/schema/email-subscriptions";
import { sendVerificationEmail } from "@/lib/services/email";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "@/lib/utils";

/**
 * POST /api/subscriptions
 * Create a new email subscription
 * Supports both authenticated (Pehchan) and unauthenticated users
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, pehchanId, constituencyCode, province } = body;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0 && existing[0].isVerified) {
      return NextResponse.json(
        {
          message: "Already subscribed",
          subscriptionId: existing[0].id,
        },
        { status: 200 }
      );
    }

    // Generate verification token
    const verificationToken = nanoid();

    // Create subscription
    const [newSubscription] = await db.insert(emailSubscriptions).values({
      email: email.toLowerCase(),
      pehchanId: pehchanId || null,
      constituencyCode: constituencyCode || null,
      province: province || null,
      verificationToken,
      isVerified: pehchanId ? true : false, // Pehchan users are auto-verified, others need to verify email
      isActive: true,
    }).returning();

    // Send verification email
    let verificationSent = false;
    if (!pehchanId) {
      // Only send verification for email-only signups
      verificationSent = await sendVerificationEmail(email, verificationToken);
    } else {
      // For Pehchan users, we trust the authentication, so auto-verify
      await db
        .update(emailSubscriptions)
        .set({ isVerified: true, verificationToken: null })
        .where(eq(emailSubscriptions.id, newSubscription.id));
    }

    return NextResponse.json(
      {
        message: pehchanId
          ? "Subscription created successfully"
          : "Subscription created. Please verify your email.",
        subscriptionId: newSubscription.id,
        verificationRequired: !pehchanId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscriptions
 * List all active subscriptions (admin use only)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const authHeader = request.headers.get("Authorization");

    // Basic auth check for admin access
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const subscriptions = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.isActive, true))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql`count(*)` } as const)
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.isActive, true));

    return NextResponse.json({
      data: subscriptions,
      total: totalResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
