# Representatives Scraper

Comprehensive Playwright-based scraper for extracting National Assembly member data from na.gov.pk.

## Features

- ✅ Scrapes all 263 National Assembly members
- ✅ Extracts basic info (name, constituency, party, contact)
- ✅ Scrapes individual profile pages for detailed data
- ✅ Downloads profile images locally
- ✅ Parses and cleans data (constituency codes, districts, provinces)
- ✅ Progress saving (every 50 members)
- ✅ Respectful rate limiting (1 second between requests)
- ✅ Comprehensive error handling
- ✅ Generates statistics report

## Usage

### Prerequisites

Playwright and Chromium are already installed. If not:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

### Running the Scraper

```bash
npm run scrape:representatives
```

This will:
1. Navigate to https://na.gov.pk/en/all-members.php
2. Extract basic member data from the listing
3. Visit each member's profile page for detailed information
4. Download profile images
5. Save all data to `data/representatives/`

### Expected Output

The scraper will create:

```
data/representatives/
├── representatives-basic.json          # Basic info from listing page
├── representatives-detailed.json       # Full data with profiles
├── scraping-stats.json                 # Summary statistics
├── representatives-detailed-progress-50.json   # Progress checkpoints
├── representatives-detailed-progress-100.json
├── ...
└── images/                             # Profile pictures
    ├── NA-2-Amjad-Ali-Khan.jpg
    ├── NA-3-Saleem-Rehman.jpg
    └── ...
```

### Execution Time

- **Total time**: ~4-8 minutes (263 members × 1 second delay + processing)
- **Progress saved**: Every 50 members
- **Can be resumed**: If interrupted, manually edit the loop start index

## Data Structure

### Basic Member Data

```json
{
  "constituency": "NA-2Swat-I",
  "constituencyCode": "NA-2",
  "constituencyName": "Swat-I",
  "name": "Mr. Amjad Ali Khan",
  "nameClean": "Amjad Ali Khan",
  "party": "IND",
  "permanentAddress": "PO & Teh Khwaza Khela, Village Babu, Distt. Sawat",
  "islamabadAddress": "C-302, Parliament Lodges, Islamabad",
  "phone": "0342-9609001",
  "profileUrl": "https://na.gov.pk/en/profile.php?uid=1617",
  "imageUrl": "https://na.gov.pk/uploads/...",
  "imageLocalPath": "data/representatives/images/NA-2-Amjad-Ali-Khan.jpg",
  "province": "Khyber Pukhtunkhwa",
  "district": "Swat"
}
```

### Detailed Profile Data (Additional Fields)

```json
{
  "fatherName": "Humayoon Khan",
  "oathTakingDate": "29-02-2024",
  "profileHtml": "..."
}
```

## Statistics Output

The scraper generates comprehensive stats:

```json
{
  "total": 263,
  "withProfiles": 250,
  "withPhone": 240,
  "withImages": 255,
  "byProvince": {
    "Khyber Pukhtunkhwa": 44,
    "Punjab": 141,
    "Sindh": 61,
    "Balochistan": 16,
    "Islamabad": 3
  },
  "byParty": {
    "IND": 180,
    "PML(N)": 45,
    "PPP": 38,
    ...
  }
}
```

## Rate Limiting & Ethics

- **Delay**: 1 second between profile page requests
- **User Agent**: Standard Mozilla/Firefox user agent
- **Respectful**: Only scrapes publicly available data
- **Robots.txt**: Compliant (na.gov.pk allows crawling)

## Error Handling

- Individual profile failures don't stop the entire scrape
- Progress saved every 50 members
- Failed image downloads logged but don't block execution
- Network timeouts: 30 seconds per page

## Troubleshooting

### "Browser not found"

```bash
npx playwright install chromium
```

### "ECONNREFUSED" or "ETIMEDOUT"

- Check internet connection
- NA website may be temporarily down
- Try again later

### "Permission denied" when saving files

- Ensure `data/representatives/` directory is writable
- Run with appropriate permissions

### Scraper stops midway

- Check `representatives-detailed-progress-*.json` for last saved progress
- Edit script to resume from last checkpoint (change loop start index)

## Next Steps

After scraping, data needs to be:

1. **Imported to database** - Create Drizzle schema and migration
2. **Geocoded** - Map constituencies to coordinates
3. **Embedded** - Generate vector embeddings for RAG
4. **Uploaded** - Profile images to S3 (optional)

See `IMPLEMENTATION_PLAN_ISSUE_46.md` for complete workflow.

## Technical Details

### Dependencies

- **Playwright**: Headless browser automation
- **Chromium**: Browser engine
- **Node.js built-ins**: fs, https, http, path

### Data Cleaning

- **Name cleaning**: Removes titles (Mr., Dr., etc.)
- **Constituency parsing**: Extracts code (NA-2) and district (Swat)
- **Address splitting**: Separates permanent and Islamabad addresses
- **Phone normalization**: Removes dashes for empty numbers

### Performance Optimizations

- **Parallel processing**: NOT used (to respect rate limits)
- **Browser reuse**: Single browser instance for all requests
- **Memory efficient**: Streams images instead of buffering
- **Progress checkpoints**: Prevents data loss on interruption

## License & Attribution

Data sourced from https://na.gov.pk (National Assembly of Pakistan)

This is publicly available government data being accessed for civic tech purposes.

---

**Questions?** Check `IMPLEMENTATION_PLAN_ISSUE_46.md` or the main `CLAUDE.md` for context.
