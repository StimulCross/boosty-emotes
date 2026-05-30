import type { MessageReceiver } from '@shared/messaging'
import type { AccessToken } from '@shared/types/access-token.ts'
import type { AlarmsManager } from './alarms-manager.ts'
import { TWITCH_CLIENT_ID } from '@shared/constants.ts'
import { storage } from '@shared/storage'
import { TwitchApi } from '@shared/twitch-api'
import { HttpStatusCodeError } from '@shared/twitch-api/errors/http-status-code.error.ts'
import { createAppLogger } from '@shared/utils'
import { LOGIN_EVENT } from './events/login.event.ts'

const VALIDATE_TWITCH_TOKEN_ALARM_NAME = 'validate_twitch_token'
const VALIDATE_TWITCH_TOKEN_INTERVAL_IN_MINUTES = 60

export class Authenticator {
	private readonly _logger = createAppLogger('Authenticator')
	private _state: string | null = null
	private _authenticationInProgress = false

	constructor(
		private readonly _eventTarget: EventTarget,
		private readonly _alarmsManager: AlarmsManager,
		private readonly _messageReceiver: MessageReceiver,
	) {
		this._setup()
	}

	public async start(): Promise<void> {
		const identity = await storage.auth.getIdentity()

		if (!identity) {
			this._logger.warn('No user identity found. Authenticator is idle.')

			return
		}

		await this._alarmsManager.registerAlarm(
			VALIDATE_TWITCH_TOKEN_ALARM_NAME,
			VALIDATE_TWITCH_TOKEN_INTERVAL_IN_MINUTES,
			async () => await this._checkTwitchAccessToken(),
		)
	}

	public async stop(): Promise<void> {
		await this._alarmsManager.clearAlarm(VALIDATE_TWITCH_TOKEN_ALARM_NAME)
	}

	private _setup(): void {
		this._messageReceiver.registerCommand('auth', async () => await this._handleAuthMessage())

		this._messageReceiver.registerEvent('logout', async () => {
			this._logger.info('Logout event received, stopping coordinator...')

			try {
				await this.stop()
			}
			catch (err) {
				this._logger.error('Failed to stop coordinator on logout', err)
			}
		})
	}

	private async _handleAuthMessage(): Promise<void> {
		if (this._authenticationInProgress) {
			this._logger.warn('Authentication already in progress. Ignoring request.')

			return
		}

		try {
			await this._authenticate()
		}
		catch (err) {
			this._logger.error('Authentication failed', err)

			await storage.auth.setIdentity(null)
			await storage.auth.setAccessToken(null)
		}
		finally {
			this._state = null
			this._authenticationInProgress = false
		}
	}

	private async _authenticate(): Promise<void> {
		this._authenticationInProgress = true
		this._logger.info('Starting authentication flow...')

		const responseRedirectUrl = await browser.identity.launchWebAuthFlow({
			url: this._buildAuthUrl(),
			interactive: true,
		})

		if (!responseRedirectUrl)
			throw new Error('Could not get response redirect URL')

		if (browser.runtime.lastError) {
			this._logger.error(browser.runtime.lastError)
			throw new Error(`Authentication error: ${browser.runtime.lastError.message}`)
		}

		const params = new URLSearchParams(new URL(responseRedirectUrl).hash.slice(1))
		const state = params.get('state')

		if (this._state !== state)
			throw new Error(`Invalid authorization state: ${state}`)

		const error = params.get('error')

		if (error)
			throw new Error(`Authorization response error: ${error}`)

		const accessToken = params.get('access_token')

		if (!accessToken)
			throw new Error('Missing access token in authorization response')

		const token: AccessToken = {
			accessToken,
			obtainedAt: Date.now() - 10_000,
			expiresIn: 0,
			isExpired: false,
		}

		const tokenInfo = await TwitchApi.getTokenInfo(token.accessToken)
		token.expiresIn = tokenInfo.expires_in

		await storage.auth.setAccessToken(token)

		const user = await TwitchApi.getAuthenticatedUser()

		if (!user)
			throw new Error('Could not get authenticated user')

		await storage.auth.setIdentity(user)

		try {
			this._eventTarget.dispatchEvent(new Event(LOGIN_EVENT))
		}
		catch (err) {
			if (err instanceof Error && !err.message.includes('Receiving end does not exist'))
				throw err
		}

		const alerts = await storage.alerts.getAll()

		// eslint-disable-next-line ts/no-unnecessary-condition
		await storage.alerts.setAll(alerts.filter(a => a.kind !== 'twitchTokenExpired'))

		this._logger.success('Authentication successful')
	}

	private async _checkTwitchAccessToken(): Promise<void> {
		let token: AccessToken | null = null

		try {
			token = await storage.auth.getAccessToken()

			if (!token)
				return

			const tokenInfo = await TwitchApi.getTokenInfo(token.accessToken)

			const expiresAt = token.obtainedAt + tokenInfo.expires_in * 1000

			if (Date.now() > expiresAt) {
				this._logger.warn('Twitch token is expired')

				await storage.auth.setAccessToken({
					accessToken: token.accessToken,
					obtainedAt: token.obtainedAt,
					expiresIn: token.expiresIn,
					isExpired: true,
				})

				const alerts = await storage.alerts.getAll()

				// eslint-disable-next-line ts/no-unnecessary-condition
				const existingAlert = alerts.find(a => a.kind === 'twitchTokenExpired')

				if (existingAlert) {
					existingAlert.closedAt = undefined
				}
				else {
					alerts.push({
						type: 'warning',
						kind: 'twitchTokenExpired',
						isCloseable: false,
					})
				}

				await storage.alerts.setAll(alerts)

				return
			}

			const alerts = await storage.alerts.getAll()

			// eslint-disable-next-line ts/no-unnecessary-condition
			const twitchTokenExpiredAlert = alerts.find(a => a.kind === 'twitchTokenExpired')

			if (twitchTokenExpiredAlert) {
				this._logger.debug('Twitch token is not expired. Removing alert.')
				await storage.alerts.setAll(alerts.filter(a => a === twitchTokenExpiredAlert))
			}
		}
		catch (err) {
			if (err instanceof HttpStatusCodeError) {
				this._logger.warn('Twitch token is expired')

				if (token) {
					await storage.auth.setAccessToken({
						accessToken: token.accessToken,
						obtainedAt: token.obtainedAt,
						expiresIn: token.expiresIn,
						isExpired: true,
					})
				}
			}

			this._logger.error('Could not validate twitch token', err)
		}
	}

	private _buildAuthUrl(): string {
		this._state = this._generateState()

		const url = new URL('https://id.twitch.tv/oauth2/authorize')
		url.searchParams.set('client_id', TWITCH_CLIENT_ID)
		url.searchParams.set('response_type', 'token')
		url.searchParams.set('redirect_uri', browser.identity.getRedirectURL())
		url.searchParams.set('scope', '')
		url.searchParams.set('state', this._state)

		return url.toString()
	}

	private _generateState(): string {
		return Array.from({ length: 32 })
			.map(() => Math.floor(Math.random() * 16).toString(16))
			.join('')
	}
}
