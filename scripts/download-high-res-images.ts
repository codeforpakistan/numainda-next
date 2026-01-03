/**
 * Download High-Resolution Representative Images
 *
 * This script downloads high-resolution images (200px) from profile pages
 * instead of the low-res thumbnails (80px) from the listing page.
 *
 * Usage: npm run download:high-res-images
 */

import { chromium, type Page } from "playwright";
import fs from "fs/promises";
import path from "path";
import https from "https";

interface Representative {
  constituencyCode: string;
  nameClean: string;
  profileUrl: string;
  profileHtml?: string;
  imageLocalPath?: string;
}

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "representatives",
  "representatives-detailed.json"
);

const IMAGES_DIR = path.join(
  process.cwd(),
  "data",
  "representatives",
  "images"
);

const DELAY_MS = 1000; // 1 second delay between downloads (respectful scraping)

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract high-res image URL from profile HTML
 */
function extractHighResImageUrl(profileHtml: string): string | null {
  // Look for: <img src="../uploads/images/NA 2-.jpg" width="200">
  const match = profileHtml.match(
    /<img\s+src="\.\.\/uploads\/images\/([^"]+)"\s+width="200"/i
  );

  if (match && match[1]) {
    // Decode HTML entities and construct full URL
    const imagePath = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    return `https://na.gov.pk/uploads/images/${imagePath}`;
  }

  return null;
}

/**
 * Download image from URL
 */
async function downloadImage(
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const filePath = path.join(IMAGES_DIR, fileName);

    https
      .get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          console.log(`    ❌ Failed to download (status: ${response.statusCode})`);
          resolve(null);
          return;
        }

        const fileStream = fs.open(filePath, "w").then((handle) => {
          return handle.createWriteStream();
        });

        fileStream.then((stream) => {
          response.pipe(stream);
          stream.on("finish", () => {
            stream.close();
            resolve(filePath);
          });
        });

        response.on("error", (err) => {
          console.log(`    ❌ Download error: ${err.message}`);
          resolve(null);
        });
      })
      .on("error", (err) => {
        console.log(`    ❌ Request error: ${err.message}`);
        resolve(null);
      });
  });
}

/**
 * Main function to download all high-res images
 */
async function downloadHighResImages() {
  console.log("🚀 Starting High-Resolution Image Download\n");

  try {
    // 1. Read the representatives data
    console.log("📖 Reading representatives data...");
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const representatives: Representative[] = JSON.parse(fileContent);
    console.log(`✅ Found ${representatives.length} representatives\n`);

    // 2. Ensure images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // 3. Filter representatives with profile HTML
    const repsWithProfiles = representatives.filter(
      (rep) => rep.profileHtml && rep.profileHtml.length > 0
    );

    console.log(
      `📊 Representatives with profile data: ${repsWithProfiles.length}/${representatives.length}\n`
    );

    // 4. Download high-res images
    console.log("🖼️  Downloading high-resolution images...\n");

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < repsWithProfiles.length; i++) {
      const rep = repsWithProfiles[i];

      console.log(
        `[${i + 1}/${repsWithProfiles.length}] ${rep.constituencyCode} - ${rep.nameClean}`
      );

      // Extract high-res image URL from profile HTML
      const highResUrl = extractHighResImageUrl(rep.profileHtml!);

      if (!highResUrl) {
        console.log("    ⚠️  No high-res image found in profile HTML");
        skipped++;
        continue;
      }

      // Generate filename
      const fileName = `${rep.constituencyCode}-${rep.nameClean.replace(/\s+/g, "-")}.jpg`;

      // Download image
      console.log(`    🔽 Downloading: ${highResUrl}`);
      const localPath = await downloadImage(highResUrl, fileName);

      if (localPath) {
        console.log(`    ✅ Saved to: ${fileName}`);
        downloaded++;

        // Update the representative data with new image path
        rep.imageLocalPath = localPath;
      } else {
        console.log(`    ❌ Failed to download`);
        failed++;
      }

      // Rate limiting delay
      if (i < repsWithProfiles.length - 1) {
        await delay(DELAY_MS);
      }
    }

    console.log("\n✅ Download Complete!\n");

    // 5. Save updated data with new image paths
    console.log("💾 Updating representatives data file...");
    await fs.writeFile(DATA_FILE, JSON.stringify(representatives, null, 2));
    console.log("✅ Data file updated\n");

    // 6. Summary
    console.log("📊 Summary:");
    console.log(`  ✅ Successfully downloaded: ${downloaded}`);
    console.log(`  ⚠️  Skipped (no image in HTML): ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📁 Total images: ${downloaded}\n`);

    // 7. Image size comparison
    console.log("💡 Image Quality:");
    console.log("  Old: 80x80px thumbnails (phpThumb)");
    console.log("  New: 200px high-resolution images");
    console.log("  Improvement: ~6x larger, much better quality!\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the downloader
downloadHighResImages();
