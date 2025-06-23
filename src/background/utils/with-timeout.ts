import pTimeout from 'p-timeout';

export const withTimeout = async <T = unknown>(promise: Promise<T>, timeoutMs: number = 10_000): Promise<T> =>
	await pTimeout<T>(promise, { milliseconds: timeoutMs });
