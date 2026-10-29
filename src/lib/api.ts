import type { ForecastResponse, RainNowcastResponse } from './types';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${path} returned ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const fetchForecast = () => getJson<ForecastResponse>('/api/forecast');

export const fetchRainNowcast = () => getJson<RainNowcastResponse>('/api/rain-nowcast');

export const fetchSunriseSunset = () =>
  getJson<{ sunrise: string; sunset: string; dawn: string; dusk: string }>('/api/sunrise-sunset');
