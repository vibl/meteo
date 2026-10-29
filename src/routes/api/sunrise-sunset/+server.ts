import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchSunriseSunset } from '$lib/server/api';

export const GET: RequestHandler = async () => json(await fetchSunriseSunset());
