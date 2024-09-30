import { TWITCH_CLIENT_ID } from '@shared/constants';
import { TwitchEmote, type UserIdentity } from '@shared/models';
import { Store } from '@shared/store';
import { type TwitchGlobalEmoteData, type TwitchResponse, type TwitchUserData } from './types';
import { callApi } from './utils';

export class TwitchApi {
	public static async revokeAccessToken(): Promise<void> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			return;
		}

		await callApi({
			url: 'revoke',
			type: 'auth',
			method: 'POST',
			query: {
				client_id: TWITCH_CLIENT_ID,
				token: accessToken
			}
		});
	}

	public static async getAuthenticatedUser(): Promise<UserIdentity | null> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			throw new Error();
		}

		const response = await callApi<TwitchResponse<TwitchUserData>>({ url: 'users' }, accessToken);

		if (response.data.length > 0) {
			const data = response.data[0];

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url
			};
		}

		return null;
	}

	public static async getUserById(userId: string): Promise<UserIdentity | null> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			throw new Error();
		}

		const response = await callApi<TwitchResponse<TwitchUserData>>(
			{ url: 'users', query: { id: userId } },
			accessToken
		);

		if (response.data.length > 0) {
			const data = response.data[0];

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url
			};
		}

		return null;
	}

	public static async getUserByName(userName: string): Promise<UserIdentity | null> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			throw new Error();
		}

		const response = await callApi<TwitchResponse<TwitchUserData>>(
			{ url: 'users', query: { login: userName } },
			accessToken
		);

		if (response.data.length > 0) {
			const data = response.data[0];

			return {
				id: data.id,
				name: data.login,
				displayName: data.display_name,
				avatar: data.profile_image_url,
				banner: data.offline_image_url
			};
		}

		return null;
	}

	public static async getGlobalEmotes(): Promise<TwitchEmote[]> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			throw new Error();
		}

		const response = await callApi<TwitchResponse<TwitchGlobalEmoteData>>(
			{ url: 'chat/emotes/global' },
			accessToken
		);
		return response.data.map(
			emote =>
				new TwitchEmote({
					scope: 'global',
					id: emote.id,
					name: emote.name
				})
		);
	}

	public static async getChannelEmotes(userId: string): Promise<TwitchEmote[]> {
		const accessToken = await Store.getTwitchAccessToken();

		if (!accessToken) {
			throw new Error();
		}

		const response = await callApi<TwitchResponse<TwitchGlobalEmoteData>>(
			{
				url: 'chat/emotes',
				query: { broadcaster_id: userId }
			},
			accessToken
		);

		return response.data.map(
			emote =>
				new TwitchEmote({
					scope: 'channel',
					id: emote.id,
					name: emote.name,
					ownerId: userId
				})
		);
	}
}
