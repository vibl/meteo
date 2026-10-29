import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchRainNowcast } from '$lib/server/api';

export const GET: RequestHandler = async () => json(await fetchRainNowcast());
