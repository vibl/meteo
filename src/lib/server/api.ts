import { error } from '@sveltejs/kit';

// Location: Nogent-sur-Marne (hardcoded)
const LAT = 48.835878;
const LON = 2.482182;
const INSEE = '940520';

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (e) => {
    const t = e <= 'Z' ? 65 : 97;
    return String.fromCharCode(t + ((e.charCodeAt(0) - t + 13) % 26));
  });
}

// Meteo France sessions expire; a stale token causes upstream to return non-JSON.
// Within a single page refresh, parallel callers share one in-flight fetch.
let inFlightToken: Promise<string> | null = null;

async function getAuthToken(): Promise<string> {
  if (inFlightToken) return inFlightToken;
  inFlightToken = (async () => {
    try {
      const resp = await fetch(
        `https://meteofrance.com/previsions-meteo-france/nogent-sur-marne/94130`,
        {
          headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            pragma: 'no-cache'
          }
        }
      );
      if (!resp.ok) {
        error(502, `Meteo France auth page returned ${resp.status}`);
      }
      const cookie = resp.headers.get('set-cookie') ?? '';
      const mfsession = cookie.match(/mfsession=([^;]+)/)?.[1] ?? '';
      if (!mfsession) {
        error(502, 'Meteo France did not return mfsession cookie');
      }
      return rot13(mfsession);
    } finally {
      inFlightToken = null;
    }
  })();
  return inFlightToken;
}

async function fetchUpstreamJson(url: string, token: string, label: string) {
  const resp = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: '*/*',
      'cache-control': 'no-cache',
      Referer: 'https://meteofrance.com/'
    }
  });
  if (!resp.ok) {
    error(502, `Meteo France ${label} returned ${resp.status}`);
  }
  return resp.json();
}

export async function fetchForecast() {
  const token = await getAuthToken();
  return fetchUpstreamJson(
    `https://rwg.meteofrance.com/internet2018client/2.0/forecast?lat=${LAT}&lon=${LON}&id=${INSEE}`,
    token,
    'forecast'
  );
}

export async function fetchRainNowcast() {
  const token = await getAuthToken();
  return fetchUpstreamJson(
    `https://rwg.meteofrance.com/internet2018client/2.0/nowcast/rain?lat=${LAT}&lon=${LON}`,
    token,
    'rain nowcast'
  );
}

// Nogent-sur-Marne coordinates for sunrise/sunset API
const SUN_LAT = 48.838;
const SUN_LON = 2.4843;

export async function fetchSunriseSunset() {
  const resp = await fetch(`https://api.sunrisesunset.io/json?lat=${SUN_LAT}&lng=${SUN_LON}`);
  const data = await resp.json();
  if (data.status !== 'OK') {
    throw new Error('Failed to fetch sunrise/sunset data');
  }
  return data.results as {
    sunrise: string;
    sunset: string;
    dawn: string;
    dusk: string;
  };
}
