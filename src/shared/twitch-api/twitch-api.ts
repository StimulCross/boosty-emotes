import type { ChannelTwitchEmote, GlobalTwitchEmote, TwitchUser } from '@shared/models'
import type { TwitchTokenInfo } from '@shared/twitch-api/types/twitch-token-info.ts'
import type { TwitchGlobalEmoteData, TwitchResponse, TwitchUserData } from './types'
import { TWITCH_CLIENT_ID } from '@shared/constants'
import { storage } from '@shared/storage'
import { callApi } from './utils'

export class TwitchApi {
	public static async getTokenInfo(accessToken: string): Promise<TwitchTokenInfo> {
		return await callApi<TwitchTokenInfo>({ type: 'auth', url: 'validate' }, accessToken)
	}

	public static async revokeAccessToken(): Promise<void> {
		const token = await this._getTwitchAccessToken()

		await callApi({
			url: 'revoke',
			type: 'auth',
			method: 'POST',
			query: {
				client_id: TWITCH_CLIENT_ID,
				token,
			},
		})
	}

	public static async getAuthenticatedUser(): Promise<TwitchUser | null> {
		const accessToken = await this._getTwitchAccessToken()

		const response = await callApi<TwitchResponse<TwitchUserData>>({ url: 'users' }, accessToken)

		if (response.data.length > 0) {
			const data = response.data[0]

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url,
			}
		}

		return null
	}

	public static async getUserById(userId: string): Promise<TwitchUser | null> {
		const accessToken = await this._getTwitchAccessToken()

		const response = await callApi<TwitchResponse<TwitchUserData>>(
			{ url: 'users', query: { id: userId } },
			accessToken,
		)

		if (response.data.length > 0) {
			const data = response.data[0]

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url,
			}
		}

		return null
	}

	public static async getUserByName(userName: string): Promise<TwitchUser | null> {
		const accessToken = await this._getTwitchAccessToken()
		const response = await callApi<TwitchResponse<TwitchUserData>>(
			{ url: 'users', query: { login: userName } },
			accessToken,
		)

		if (response.data.length > 0) {
			const data = response.data[0]

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url,
			}
		}

		return null
	}

	public static async getGlobalEmotes(): Promise<GlobalTwitchEmote[]> {
		const accessToken = await this._getTwitchAccessToken()
		const response = await callApi<TwitchResponse<TwitchGlobalEmoteData>>(
			{ url: 'chat/emotes/global' },
			accessToken,
		)

		return response.data.map(emote => ({
			type: 'emote',
			provider: 'twitch',
			id: emote.id,
			scope: 'global',
			name: emote.name,
			code: emote.name.toLowerCase(),
		}))
	}

	public static async getChannelEmotes(userId: string): Promise<ChannelTwitchEmote[]> {
		const accessToken = await this._getTwitchAccessToken()
		const response = await callApi<TwitchResponse<TwitchGlobalEmoteData>>(
			{
				url: 'chat/emotes',
				query: { broadcaster_id: userId },
			},
			accessToken,
		)

		return response.data.map(emote => ({
			type: 'emote',
			provider: 'twitch',
			id: emote.id,
			scope: 'channel',
			name: emote.name,
			code: emote.name.toLowerCase(),
			userId,
		}))
	}

	private static async _getTwitchAccessToken(): Promise<string> {
		const accessToken = await storage.auth.getAccessToken()

		if (!accessToken)
			throw new Error('No access token found. Please login again.')

		const expiresAt = accessToken.obtainedAt + accessToken.expiresIn * 1000

		if (accessToken.isExpired || Date.now() > expiresAt)
			throw new Error('Access token is expired. Please login again.')

		return accessToken.accessToken
	}
}
