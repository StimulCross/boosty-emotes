import { createAppLogger } from '@shared/utils'

type CacheEntry = 'dialog' | 'user'

interface BoostyAuthCookie {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

export interface BoostyDialogResponse {
	chatmate: {
		id: number
		// username (code)
		url: string
		// display name
		name: string
	}
}

export interface BoostyUserResponse {
	// username (code)
	blogUrl: string
	owner: {
		id: number
		// display name
		name: string
	}
}

export class BoostyApiClient {
	private readonly _logger = createAppLogger('BoostyApiClient')
	private readonly _baseUrl = 'https://api.boosty.to'
	private readonly _cache: Record<CacheEntry, Record<string, Promise<unknown> | unknown>> = { user: {}, dialog: {} }

	public async getUser(name: string): Promise<BoostyUserResponse | null> {
		if (this._cache.user[name])
			return this._cache.user[name] as BoostyUserResponse

		const resultPromise = this._request<BoostyUserResponse>(`/v1/blog/${name}`)
		this._cache.user[name] = resultPromise

		let result: BoostyUserResponse | null = null

		try {
			result = await resultPromise
		}
		catch (err) {
			this._logger.error(`Failed to get Boosty user @${name}`, err)
			result = null
		}

		this._cache.user[name] = result

		return result
	}

	public async getDialog(dialogId: string): Promise<BoostyDialogResponse | null> {
		if (this._cache.dialog[dialogId])
			return this._cache.dialog[dialogId] as BoostyDialogResponse

		const resultPromise = this._request<BoostyDialogResponse>(`/v1/dialog/${dialogId}`)
		this._cache.dialog[dialogId] = resultPromise

		let result: BoostyDialogResponse | null = null

		try {
			result = await resultPromise
		}
		catch (err) {
			this._logger.error(`Failed to get Boosty dialog ${dialogId}`, err)
			result = null
		}

		this._cache.dialog[dialogId] = result

		return result
	}

	private async _request<T>(path: string): Promise<T | null> {
		const token = this._getAccessToken()

		if (!token) {
			this._logger.warn('No access token found in cookies')

			return null
		}

		const headers = this._buildHeaders(token)

		try {
			const response = await fetch(`${this._baseUrl}${path}`, { headers })

			if (!response.ok) {
				this._logger.error(
					`Request failed: ${response.status} - ${response.statusText};`,
					await response.json(),
					path,
				)

				return null
			}

			return (await response.json()) as T
		}
		catch (err) {
			this._logger.error('Request error', path, err)

			return null
		}
	}

	private _buildHeaders(token: string): Headers {
		const headers = new Headers()

		headers.append('Accept', 'application/json, text/plain, */*')
		headers.append('Authorization', `Bearer ${token}`)
		headers.append('X-App', 'web')
		headers.append('X-Referer', 'boosty.to')
		headers.append('X-Locale', 'ru_RU')

		const clientId = this._getClientId()

		if (clientId)
			headers.append('X-From-Id', clientId)

		return headers
	}

	private _getAccessToken(): string | null {
		try {
			const raw = this._parseCookie('auth')

			if (!raw)
				return null

			const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<BoostyAuthCookie>

			return parsed.accessToken ?? null
		}
		catch {
			this._logger.warn('Failed to parse auth cookie')

			return null
		}
	}

	private _getClientId(): string | null {
		return this._parseCookie('_clientId')
	}

	private _parseCookie(name: string): string | null {
		const match = new RegExp(String.raw`(?:^|;\s*)${name}=(?<value>[^;]*)`, 'u').exec(document.cookie)

		return match?.groups?.value ?? null
	}
}
