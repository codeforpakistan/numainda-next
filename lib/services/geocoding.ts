/**
 * Geocoding Service using OpenStreetMap Nominatim API
 *
 * Provides geocoding functionality to convert constituency names and addresses
 * into latitude/longitude coordinates for map-based representative search.
 *
 * API: https://nominatim.openstreetmap.org/
 * Rate Limit: 1 request per second (respectful usage)
 * No API key required
 */

import https from 'https';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  accuracy: 'high' | 'medium' | 'low';
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  class: string;
}

/**
 * Geocode a location using Nominatim API
 */
export async function geocodeLocation(
  query: string,
  countryCode: string = 'pk'
): Promise<GeocodingResult | null> {
  return new Promise((resolve) => {
    // Build search query
    const searchQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&countrycodes=${countryCode}&format=json&limit=1`;

    const options = {
      headers: {
        'User-Agent': 'Numainda-Pakistan-Civic-App/1.0 (numainda@codeforpakistan.org)',
      },
    };

    https
      .get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const results: NominatimResponse[] = JSON.parse(data);

            if (results.length === 0) {
              resolve(null);
              return;
            }

            const result = results[0];

            // Determine accuracy based on result type and importance
            let accuracy: 'high' | 'medium' | 'low' = 'low';
            if (result.type === 'administrative' || result.type === 'city') {
              accuracy = 'high';
            } else if (result.importance > 0.5) {
              accuracy = 'medium';
            }

            resolve({
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
              displayName: result.display_name,
              accuracy,
            });
          } catch (error) {
            console.error('Error parsing geocoding response:', error);
            resolve(null);
          }
        });
      })
      .on('error', (error) => {
        console.error('Error geocoding location:', error);
        resolve(null);
      });
  });
}

/**
 * Geocode a Pakistani constituency
 * Tries multiple query strategies for best results
 */
export async function geocodeConstituency(
  constituencyName: string,
  district?: string | null,
  province?: string | null
): Promise<GeocodingResult | null> {
  // Strategy 1: Try constituency name + district + province
  if (district && province) {
    const query1 = `${constituencyName}, ${district}, ${province}, Pakistan`;
    const result1 = await geocodeLocation(query1);
    if (result1 && result1.accuracy === 'high') {
      return result1;
    }
  }

  // Strategy 2: Try district + province (most reliable for constituencies)
  if (district && province) {
    const query2 = `${district}, ${province}, Pakistan`;
    const result2 = await geocodeLocation(query2);
    if (result2) {
      return result2;
    }
  }

  // Strategy 3: Try constituency name + province
  if (province) {
    const query3 = `${constituencyName}, ${province}, Pakistan`;
    const result3 = await geocodeLocation(query3);
    if (result3) {
      return result3;
    }
  }

  // Strategy 4: Try just constituency name
  const query4 = `${constituencyName}, Pakistan`;
  return await geocodeLocation(query4);
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocode with rate limiting (1 req/sec for Nominatim)
 */
export async function geocodeWithRateLimit(
  constituencyName: string,
  district?: string | null,
  province?: string | null,
  delayMs: number = 1000
): Promise<GeocodingResult | null> {
  const result = await geocodeConstituency(constituencyName, district, province);
  await delay(delayMs);
  return result;
}
