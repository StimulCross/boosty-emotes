export type TwitchApiCallType = 'api' | 'auth';

export interface TwitchApiCallOptions {
	url: string;
	type?: TwitchApiCallType;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	query?: Record<string, string>;
	json?: Record<string, unknown>;
}
