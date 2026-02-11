import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSubscriptions } from "@/lib/db/schema/email-subscriptions";
import { eq } from "drizzle-orm";

/**
 * GET/PUT /api/subscriptions/[id]
 * Get or update subscription preferences
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authHeader = request.headers.get("Authorization");

    // Check if this is the subscription owner or has auth token
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.id, id))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Return subscription (without sensitive token)
    const sub = subscription[0];
    const { verificationToken, ...safeData } = sub;

    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authHeader = request.headers.get("Authorization");

    // Verify ownership or auth token
    // In production, you'd validate the auth token here
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isActive,
      includeBills,
      includeProceedings,
      includeRepresentatives,
      constituencyCode,
      province,
    } = body;

    // Check subscription exists
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.id, id))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update preferences
    const updated = await db
      .update(emailSubscriptions)
      .set({
        isActive:
          isActive !== undefined
            ? isActive
            : subscription[0].isActive,
        includeBills:
          includeBills !== undefined
            ? includeBills
            : subscription[0].includeBills,
        includeProceedings:
          includeProceedings !== undefined
            ? includeProceedings
            : subscription[0].includeProceedings,
        includeRepresentatives:
          includeRepresentatives !== undefined
            ? includeRepresentatives
            : subscription[0].includeRepresentatives,
        constituencyCode: constituencyCode || subscription[0].constituencyCode,
        province: province || subscription[0].province,
        updatedAt: new Date(),
      })
      .where(eq(emailSubscriptions.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    // Return updated subscription (without sensitive data)
    const { verificationToken, ...safeData } = updated[0];
    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete - mark as inactive
    const subscription = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.id, id))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    await db
      .update(emailSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(emailSubscriptions.id, id));

    return NextResponse.json({ message: "Subscription deleted" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
