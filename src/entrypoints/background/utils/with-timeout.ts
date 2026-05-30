import pTimeout from 'p-timeout'

export async function withTimeout<T = unknown>(promise: Promise<T>, timeoutMs = 10_000): Promise<T> {
	return await pTimeout<T>(promise, { milliseconds: timeoutMs })
}
