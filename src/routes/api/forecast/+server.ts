import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchForecast } from '$lib/server/api';

export const GET: RequestHandler = async () => json(await fetchForecast());
