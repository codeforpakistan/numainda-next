import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSubscriptions } from "@/lib/db/schema/email-subscriptions";
import { eq } from "drizzle-orm";

/**
 * GET /api/subscriptions/verify?token=xxx
 * Verify email subscription via token
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token required" },
        { status: 400 }
      );
    }

    // Find subscription with this token
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.verificationToken, token))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    const sub = subscription[0];

    // Check if already verified
    if (sub.isVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Update subscription to verified
    await db
      .update(emailSubscriptions)
      .set({
        isVerified: true,
        verificationToken: null,
      })
      .where(eq(emailSubscriptions.id, sub.id));

    // Redirect to confirmation page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?verified=true`,
      { status: 302 }
    );
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
