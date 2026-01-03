/**
 * National Assembly Representatives Scraper
 *
 * Scrapes https://na.gov.pk/en/all-members.php to extract:
 * 1. Basic member information from the listing page
 * 2. Detailed profile data from individual profile pages
 * 3. Stores data in JSON format for database import
 *
 * Usage: npm run scrape:representatives
 */

import { chromium, type Browser, type Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

interface RepresentativeBasic {
  constituency: string;
  constituencyCode: string;
  constituencyName: string;
  name: string;
  nameClean: string;
  party: string;
  permanentAddress: string;
  islamabadAddress: string;
  phone: string;
  profileUrl: string;
  imageUrl: string;
  imageLocalPath?: string;
  province?: string;
  district?: string;
}

interface RepresentativeDetailed extends RepresentativeBasic {
  fatherName?: string;
  oathTakingDate?: string;
  profileHtml?: string;
}

const BASE_URL = 'https://na.gov.pk';
const MEMBERS_URL = `${BASE_URL}/en/all-members.php`;
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'representatives');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const DELAY_BETWEEN_PROFILES = 1000; // 1 second delay to be respectful

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download image from URL and save locally
 */
async function downloadImage(imageUrl: string, fileName: string): Promise<string | null> {
  if (!imageUrl || imageUrl.includes('avatar-male.png') || imageUrl.includes('nophoto')) {
    return null; // Skip default/no photo images
  }

  try {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    const outputPath = path.join(IMAGES_DIR, fileName);

    // Create images directory if it doesn't exist
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // Download image
    await new Promise<void>((resolve, reject) => {
      const protocol = fullUrl.startsWith('https') ? https : http;

      protocol.get(fullUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const fileStream = require('fs').createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', reject);
      }).on('error', reject);
    });

    return outputPath;
  } catch (error) {
    console.error(`  ⚠️  Failed to download image: ${error}`);
    return null;
  }
}

/**
 * Parse constituency code and name from combined string
 * e.g., "NA-2Swat-I" → { code: "NA-2", name: "Swat-I", district: "Swat" }
 */
function parseConstituency(raw: string): { code: string; name: string; district: string } {
  const match = raw.match(/^(NA-\d+)(.+)$/);
  if (!match) return { code: raw, name: '', district: '' };

  const code = match[1];
  const name = match[2].trim();

  // Extract district from name (everything before hyphen or roman numeral)
  const districtMatch = name.match(/^([^-I]+)/);
  const district = districtMatch ? districtMatch[1].trim() : name;

  return { code, name, district };
}

/**
 * Clean member name (remove "Mr.", "Ms.", extra spaces)
 */
function cleanName(name: string): string {
  return name
    .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Engr\.|Mst\.|Syed|Sahibzada|Sardar|Malik)\s+/gi, '')
    .trim();
}

/**
 * Extract province from the page (e.g., "Khyber Pukhtunkhwa (44)")
 */
function extractProvince(text: string): string | undefined {
  const provincePatterns = [
    /Khyber Pukhtunkhwa/i,
    /Punjab/i,
    /Sindh/i,
    /Balochistan/i,
    /Islamabad/i,
    /FATA/i,
  ];

  for (const pattern of provincePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return undefined;
}

/**
 * Scrape the main members listing page
 */
async function scrapeMainListing(page: Page): Promise<RepresentativeBasic[]> {
  console.log('📄 Navigating to members page...');
  await page.goto(MEMBERS_URL, { waitUntil: 'networkidle' });

  console.log('🔍 Extracting member data from listing...');

  const members = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const results: any[] = [];
    let currentProvince = '';

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      // Check if this is a province header row
      const provinceHeader = row.textContent?.match(/(Khyber Pukhtunkhwa|Punjab|Sindh|Balochistan|Islamabad|FATA)\s*\(\d+\)/i);
      if (provinceHeader) {
        currentProvince = provinceHeader[1];
        return;
      }

      // Skip rows without enough cells
      if (cells.length < 5) return;

      // Extract data
      const constituency = cells[0]?.textContent?.trim() || '';
      const nameCell = cells[1];
      const name = nameCell?.textContent?.trim() || '';
      const nameLink = nameCell?.querySelector('a')?.href || '';
      const party = cells[2]?.textContent?.trim() || '';
      const address = cells[3]?.textContent?.trim() || '';
      const phone = cells[4]?.textContent?.trim() || '';
      const profileCell = cells[5];
      const profileLink = profileCell?.querySelector('a')?.href || '';
      const imageUrl = profileCell?.querySelector('img')?.src || '';

      // Skip empty rows
      if (!name || !constituency) return;

      // Split addresses (permanent and Islamabad)
      const addresses = address.split(/\n\s*\n/).map(a => a.trim()).filter(Boolean);
      const permanentAddress = addresses[0] || '';
      const islamabadAddress = addresses[1] || addresses[0] || '';

      results.push({
        constituency,
        name,
        nameLink,
        party,
        permanentAddress,
        islamabadAddress,
        phone: phone === '-' ? '' : phone,
        profileUrl: profileLink,
        imageUrl,
        province: currentProvince,
      });
    });

    return results;
  });

  console.log(`✅ Extracted ${members.length} members from listing`);

  // Parse and clean data
  const cleanedMembers: RepresentativeBasic[] = members.map((member: any) => {
    const { code, name: constName, district } = parseConstituency(member.constituency);

    return {
      constituency: member.constituency,
      constituencyCode: code,
      constituencyName: constName,
      name: member.name,
      nameClean: cleanName(member.name),
      party: member.party,
      permanentAddress: member.permanentAddress,
      islamabadAddress: member.islamabadAddress,
      phone: member.phone,
      profileUrl: member.profileUrl,
      imageUrl: member.imageUrl,
      province: member.province,
      district: district,
    };
  });

  return cleanedMembers;
}

/**
 * Scrape detailed profile page for a single representative
 */
async function scrapeProfilePage(page: Page, profileUrl: string): Promise<Partial<RepresentativeDetailed>> {
  try {
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(500); // Small delay for rendering

    const profileData = await page.evaluate(() => {
      const data: Record<string, string> = {};

      // Extract all table rows with headers
      const rows = Array.from(document.querySelectorAll('table tr'));
      rows.forEach(row => {
        const header = row.querySelector('th')?.textContent?.trim();
        const value = row.querySelector('td')?.textContent?.trim();
        if (header && value) {
          data[header] = value;
        }
      });

      // Get full page HTML for future reference
      const mainTable = document.querySelector('table.profile_tbl');
      const profileHtml = mainTable ? mainTable.innerHTML : '';

      return { ...data, profileHtml };
    });

    return {
      fatherName: profileData["Father's Name"] || profileData["Father Name"],
      oathTakingDate: profileData["Oath Taking Date"] || profileData["Oath Date"],
      profileHtml: profileData.profileHtml,
    };
  } catch (error) {
    console.error(`❌ Error scraping profile ${profileUrl}:`, error);
    return {};
  }
}

/**
 * Main scraper function
 */
async function scrapeRepresentatives() {
  console.log('🚀 Starting National Assembly Representatives Scraper\n');

  let browser: Browser | null = null;

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    // Step 1: Scrape main listing
    const basicMembers = await scrapeMainListing(page);

    // Save basic data
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'representatives-basic.json'),
      JSON.stringify(basicMembers, null, 2)
    );
    console.log(`💾 Saved basic data to representatives-basic.json\n`);

    // Step 2: Scrape individual profiles
    console.log(`📋 Scraping ${basicMembers.length} individual profiles...`);
    console.log(`⏱️  Estimated time: ~${Math.ceil(basicMembers.length * DELAY_BETWEEN_PROFILES / 60000)} minutes\n`);

    const detailedMembers: RepresentativeDetailed[] = [];

    for (let i = 0; i < basicMembers.length; i++) {
      const member = basicMembers[i];
      const progress = `[${i + 1}/${basicMembers.length}]`;

      console.log(`${progress} Scraping profile: ${member.nameClean} (${member.constituencyCode})`);

      if (!member.profileUrl) {
        console.log(`  ⚠️  No profile URL, skipping`);
        detailedMembers.push(member as RepresentativeDetailed);
        continue;
      }

      try {
        const profileDetails = await scrapeProfilePage(page, member.profileUrl);

        // Download profile image
        let imageLocalPath: string | null = null;
        if (member.imageUrl) {
          const imageFileName = `${member.constituencyCode.replace('/', '-')}-${member.nameClean.replace(/\s+/g, '-')}.jpg`;
          console.log(`  📷 Downloading image: ${imageFileName}`);
          imageLocalPath = await downloadImage(member.imageUrl, imageFileName);
        }

        detailedMembers.push({
          ...member,
          ...profileDetails,
          imageLocalPath: imageLocalPath || undefined,
        });

        console.log(`  ✅ Scraped successfully${imageLocalPath ? ' (with image)' : ''}`);
      } catch (error) {
        console.log(`  ❌ Error: ${error}`);
        detailedMembers.push(member as RepresentativeDetailed);
      }

      // Respectful delay between requests
      if (i < basicMembers.length - 1) {
        await delay(DELAY_BETWEEN_PROFILES);
      }

      // Save progress every 50 members
      if ((i + 1) % 50 === 0) {
        await fs.writeFile(
          path.join(OUTPUT_DIR, `representatives-detailed-progress-${i + 1}.json`),
          JSON.stringify(detailedMembers, null, 2)
        );
        console.log(`\n💾 Progress saved (${i + 1}/${basicMembers.length})\n`);
      }
    }

    // Save final detailed data
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'representatives-detailed.json'),
      JSON.stringify(detailedMembers, null, 2)
    );

    console.log('\n✅ Scraping complete!');
    console.log(`📊 Total members scraped: ${detailedMembers.length}`);
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);

    // Generate summary stats
    const stats = {
      total: detailedMembers.length,
      byProvince: {} as Record<string, number>,
      byParty: {} as Record<string, number>,
      withProfiles: detailedMembers.filter(m => m.fatherName).length,
      withPhone: detailedMembers.filter(m => m.phone).length,
      withImages: detailedMembers.filter(m => m.imageLocalPath).length,
    };

    detailedMembers.forEach(member => {
      const province = member.province || 'Unknown';
      const party = member.party || 'Unknown';
      stats.byProvince[province] = (stats.byProvince[province] || 0) + 1;
      stats.byParty[party] = (stats.byParty[party] || 0) + 1;
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'scraping-stats.json'),
      JSON.stringify(stats, null, 2)
    );

    console.log('\n📈 Statistics:');
    console.log(`  - Total members: ${stats.total}`);
    console.log(`  - With complete profiles: ${stats.withProfiles}`);
    console.log(`  - With phone numbers: ${stats.withPhone}`);
    console.log(`  - With profile images: ${stats.withImages}`);
    console.log('\n  By Province:');
    Object.entries(stats.byProvince).forEach(([province, count]) => {
      console.log(`    ${province}: ${count}`);
    });
    console.log('\n  By Party:');
    Object.entries(stats.byParty).forEach(([party, count]) => {
      console.log(`    ${party}: ${count}`);
    });

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🌐 Browser closed');
    }
  }
}

// Run the scraper
scrapeRepresentatives()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Scraper failed:', error);
    process.exit(1);
  });
