import { TWITCH_CLIENT_ID } from '@shared/constants';
import { HttpStatusCodeError } from '@shared/twitch-api/errors/http-status-code.error';
import { normalizeTwitchUrl } from '@shared/twitch-api/utils/normalize-twitch-url';
import { type TwitchApiCallOptions } from '@shared/twitch-api/utils/twitch-api-call-options';

export async function callApiRaw(options: TwitchApiCallOptions, accessToken?: string): Promise<Response> {
	options.type ??= 'api';
	const headers = new Headers();

	if (options.type === 'api') {
		headers.set('Authorization', `Bearer ${accessToken}`);
		headers.set('Client-ID', TWITCH_CLIENT_ID);
	}

	const reqOptions: RequestInit = {
		method: options.method ?? 'GET',
		headers,
		mode: 'cors'
	};

	if (options.json) {
		headers.append('Content-Type', 'application/json');
		reqOptions.body = JSON.stringify(options.json);
	}

	const params = options.query ? `?${new URLSearchParams(options.query).toString()}` : '';
	return await fetch(normalizeTwitchUrl(`${options.url}${params}`, options.type), reqOptions);
}

export async function callApi<T>(options: TwitchApiCallOptions, accessToken?: string): Promise<T> {
	const response = await callApiRaw(options, accessToken);

	if (!response.ok) {
		const message = await response.text();
		throw new HttpStatusCodeError(response.status, message, response.url);
	}

	if (response.status === 204) {
		return undefined as unknown as T;
	}

	const text = await response.text();

	if (!text) {
		return undefined as unknown as T;
	}

	return JSON.parse(text) as T;
}
