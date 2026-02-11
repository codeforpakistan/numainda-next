import { db } from "@/lib/db";
import { bills, parliamentaryProceedings, representatives } from "@/lib/db/schema";
import { sendDigestEmail } from "./email";
import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Digest generator service
 * Creates and sends monthly digest emails with bill, proceeding, and representative updates
 */

export interface DigestContent {
  bills: BillForDigest[];
  proceedings: ProceedingForDigest[];
  representatives: RepresentativeForDigest[];
}

interface BillForDigest {
  id: string;
  title: string;
  summary: string;
  status: string;
  passageDate: string | null;
}

interface ProceedingForDigest {
  id: string;
  title: string;
  date: string;
}

interface RepresentativeForDigest {
  id: string;
  name: string;
  party: string;
  constituency: string;
  phone?: string;
}

/**
 * Get bills from the past month
 */
export async function getRecentBills(
  daysBack: number = 30
): Promise<BillForDigest[]> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - daysBack);

  try {
    const recentBills = await db
      .select({
        id: bills.id,
        title: bills.title,
        summary: bills.summary,
        status: bills.status,
        passageDate: bills.passageDate,
      })
      .from(bills)
      .where(gte(bills.createdAt, daysAgo))
      .orderBy(bills.createdAt);

    // Normalize DB types to the Digest interface (string | null for dates)
    return recentBills.map((b) => ({
      id: b.id,
      title: b.title,
      summary: b.summary,
      status: b.status,
      passageDate: b.passageDate ? new Date(b.passageDate).toISOString().split("T")[0] : null,
    }));
  } catch (error) {
    console.error("Error fetching bills for digest:", error);
    return [];
  }
}

/**
 * Get parliamentary proceedings from the past month
 */
export async function getRecentProceedings(
  daysBack: number = 30
): Promise<ProceedingForDigest[]> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - daysBack);

  try {
    const recentProceedings = await db
      .select({
        id: parliamentaryProceedings.id,
        title: parliamentaryProceedings.title,
        date: parliamentaryProceedings.date,
      })
      .from(parliamentaryProceedings)
      .where(gte(parliamentaryProceedings.createdAt, daysAgo))
      .orderBy(parliamentaryProceedings.date);

    return recentProceedings.map((p) => ({
      id: p.id,
      title: p.title,
      date: p.date ? new Date(p.date).toISOString().split("T")[0] : "",
    }));
  } catch (error) {
    console.error("Error fetching proceedings for digest:", error);
    return [];
  }
}

/**
 * Get new representatives or updated information
 */
export async function getNewRepresentatives(
  daysBack: number = 30
): Promise<RepresentativeForDigest[]> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - daysBack);

  try {
    const newReps = await db
      .select({
        id: representatives.id,
        name: representatives.name,
        party: representatives.party,
        constituency: representatives.constituency,
        phone: representatives.phone,
      })
      .from(representatives)
      .where(gte(representatives.createdAt, daysAgo))
      .orderBy(representatives.createdAt);

    // Convert nullable phone (string | null) into optional field (string | undefined)
    return newReps.map((r) => ({
      id: r.id,
      name: r.name,
      party: r.party,
      constituency: r.constituency,
      phone: r.phone ?? undefined,
    }));
  } catch (error) {
    console.error("Error fetching representatives for digest:", error);
    return [];
  }
}

/**
 * Format digest content as HTML email
 */
export function generateDigestHTML(
  digestContent: DigestContent,
  preferences: {
    includeBills: boolean;
    includeProceedings: boolean;
    includeRepresentatives: boolean;
  }
): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  let html = `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a7f5c 0%, #0d5a44 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
          .section { border: 1px solid #ddd; border-top: none; padding: 20px; }
          .section:last-child { border-radius: 0 0 8px 8px; }
          .section h2 { color: #1a7f5c; font-size: 20px; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
          .section-empty { color: #999; font-style: italic; }
          .item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
          .item:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
          .item h3 { margin: 0 0 8px 0; font-size: 16px; color: #1a7f5c; }
          .item-meta { font-size: 13px; color: #666; margin-bottom: 8px; }
          .item-summary { color: #555; }
          .button { display: inline-block; padding: 10px 20px; background: #1a7f5c; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; margin-top: 10px; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
          .footer a { color: #1a7f5c; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-numainda.svg" alt="Numainda Logo" style="width: 150px; height: auto; max-width: 100%;">
          </div>
          <div class="header">
            <h1>📋 Numainda Monthly Digest</h1>
            <p>${currentDate}</p>
          </div>

          ${
            preferences.includeBills
              ? `
          <div class="section">
            <h2>📜 Recent Bills & Acts</h2>
            ${
              digestContent.bills.length > 0
                ? digestContent.bills
                    .map(
                      (bill) => `
              <div class="item">
                <h3>${escapeHtml(bill.title)}</h3>
                <div class="item-meta">Status: <strong>${bill.status}</strong>${bill.passageDate ? ` • Passed: ${bill.passageDate}` : ""}</div>
                <div class="item-summary">${escapeHtml(bill.summary.substring(0, 300))}...</div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/bills/${bill.id}" class="button">Read More</a>
              </div>
            `
                    )
                    .join("")
                : '<p class="section-empty">No new bills this month</p>'
            }
          </div>
          `
              : ""
          }

          ${
            preferences.includeProceedings
              ? `
          <div class="section">
            <h2>🏛️ Parliamentary Proceedings</h2>
            ${
              digestContent.proceedings.length > 0
                ? digestContent.proceedings
                    .map(
                      (proceeding) => `
              <div class="item">
                <h3>${escapeHtml(proceeding.title)}</h3>
                <div class="item-meta">Date: ${proceeding.date}</div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/proceedings/${proceeding.id}" class="button">View Details</a>
              </div>
            `
                    )
                    .join("")
                : '<p class="section-empty">No new proceedings this month</p>'
            }
          </div>
          `
              : ""
          }

          ${
            preferences.includeRepresentatives
              ? `
          <div class="section">
            <h2>👥 Representative Updates</h2>
            ${
              digestContent.representatives.length > 0
                ? digestContent.representatives
                    .map(
                      (rep) => `
              <div class="item">
                <h3>${escapeHtml(rep.name)}</h3>
                <div class="item-meta">
                  <strong>${escapeHtml(rep.party)}</strong> • ${escapeHtml(rep.constituency)}
                  ${rep.phone ? `• ${rep.phone}` : ""}
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/representatives/${rep.id}" class="button">View Profile</a>
              </div>
            `
                    )
                    .join("")
                : '<p class="section-empty">No new representatives this month</p>'
            }
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>You're receiving this because you subscribed to the Numainda newsletter.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/subscriptions">Manage Preferences</a> •
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/unsubscribe">Unsubscribe</a>
            </p>
            <p>© 2026 Numainda. Making Pakistan's Parliament accessible to all.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Format digest content as plain text
 */
export function generateDigestText(
  digestContent: DigestContent,
  preferences: {
    includeBills: boolean;
    includeProceedings: boolean;
    includeRepresentatives: boolean;
  }
): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  let text = `NUMAINDA MONTHLY DIGEST - ${currentDate}\n`;
  text += `${"=".repeat(50)}\n\n`;

  if (preferences.includeBills) {
    text += `📜 RECENT BILLS & ACTS\n`;
    text += `${"-".repeat(50)}\n`;
    if (digestContent.bills.length > 0) {
      digestContent.bills.forEach((bill) => {
        text += `\n${bill.title}\n`;
        text += `Status: ${bill.status}${bill.passageDate ? ` (Passed: ${bill.passageDate})` : ""}\n`;
        text += `${bill.summary.substring(0, 200)}...\n`;
        text += `${process.env.NEXT_PUBLIC_APP_URL}/bills/${bill.id}\n`;
      });
    } else {
      text += `No new bills this month\n`;
    }
    text += `\n`;
  }

  if (preferences.includeProceedings) {
    text += `🏛️ PARLIAMENTARY PROCEEDINGS\n`;
    text += `${"-".repeat(50)}\n`;
    if (digestContent.proceedings.length > 0) {
      digestContent.proceedings.forEach((proceeding) => {
        text += `\n${proceeding.title}\n`;
        text += `Date: ${proceeding.date}\n`;
        text += `${process.env.NEXT_PUBLIC_APP_URL}/proceedings/${proceeding.id}\n`;
      });
    } else {
      text += `No new proceedings this month\n`;
    }
    text += `\n`;
  }

  if (preferences.includeRepresentatives) {
    text += `👥 REPRESENTATIVE UPDATES\n`;
    text += `${"-".repeat(50)}\n`;
    if (digestContent.representatives.length > 0) {
      digestContent.representatives.forEach((rep) => {
        text += `\n${rep.name}\n`;
        text += `${rep.party} - ${rep.constituency}${rep.phone ? ` - ${rep.phone}` : ""}\n`;
        text += `${process.env.NEXT_PUBLIC_APP_URL}/representatives/${rep.id}\n`;
      });
    } else {
      text += `No new representatives this month\n`;
    }
    text += `\n`;
  }

  text += `\n${"-".repeat(50)}\n`;
  text += `You're receiving this because you subscribed to the Numainda newsletter.\n`;
  text += `Manage preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings/subscriptions\n`;
  text += `Unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/unsubscribe\n`;
  text += `© 2026 Numainda. Making Pakistan's Parliament accessible to all.\n`;

  return text;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
