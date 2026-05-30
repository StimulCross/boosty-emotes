import type { ChannelStvEmote, GlobalStvEmote } from '@shared/models'
import type { SevenTvChannel, SevenTvEmoteSet } from './data'

export class SevenTvApiClient {
	public async getGlobalEmotes(): Promise<GlobalStvEmote[]> {
		const response = await fetch('https://7tv.io/v3/emote-sets/global')

		if (!response.ok) {
			throw new Error(
				`Failed to fetch 7TV global emotes; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as SevenTvEmoteSet

		return data.emotes.map(
			emote =>
				({
					type: (emote.data.flags || 0 & 256) === 0 ? 'emote' : 'overlay',
					provider: 'stv',
					id: emote.data.id,
					scope: 'global',
					name: emote.data.name,
					code: emote.data.name.toLowerCase(),
					flags: emote.data.flags,
				}) satisfies GlobalStvEmote,
		)
	}

	public async getChannelEmotes(userId: string): Promise<ChannelStvEmote[]> {
		const response = await fetch(`https://7tv.io/v3/users/twitch/${userId}`)

		if (!response.ok) {
			if (response.status === 404)
				return []

			throw new Error(
				`Failed to fetch 7TV channel emotes for user: ${userId}; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as SevenTvChannel

		return data.emote_set.emotes.map(
			emote =>
				({
					type: (emote.data.flags || 0 & 256) === 0 ? 'emote' : 'overlay',
					provider: 'stv',
					id: emote.data.id,
					scope: 'channel',
					name: emote.data.name,
					code: emote.data.name.toLowerCase(),
					userId,
					flags: emote.data.flags,
				}) satisfies ChannelStvEmote,
		)
	}
}
