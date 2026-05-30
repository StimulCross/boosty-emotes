import type { ChannelBttvEmote, GlobalBttvEmote } from '@shared/models'
import type { BttvChannelEmotesData } from './data/bttv-channel-emote-data.ts'
import type { BttvGlobalEmoteData } from './data/emote/bttv-global-emote-data.ts'

export class BttvApiClient {
	public async getGlobalEmotes(): Promise<GlobalBttvEmote[]> {
		const response = await fetch('https://api.betterttv.net/3/cached/emotes/global')

		if (!response.ok) {
			throw new Error(
				`Failed to fetch BTTV global emotes; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as BttvGlobalEmoteData[]

		return data.map(emote => ({
			type: 'emote',
			provider: 'bttv',
			id: emote.id,
			scope: 'global',
			name: emote.code,
			code: emote.code.toLowerCase(),
		}))
	}

	public async getChannelEmotes(userId: string): Promise<ChannelBttvEmote[]> {
		const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId}`)

		if (!response.ok) {
			if (response.status === 404)
				return []

			throw new Error(
				`Failed to fetch BTTV channel emotes for user: ${userId}; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as BttvChannelEmotesData

		const result: ChannelBttvEmote[] = []

		for (const emote of data.channelEmotes) {
			result.push({
				type: 'emote',
				provider: 'bttv',
				id: emote.id,
				scope: 'channel',
				name: emote.code,
				code: emote.code.toLowerCase(),
				userId,
			})
		}

		for (const emote of data.sharedEmotes) {
			result.push({
				type: 'emote',
				provider: 'bttv',
				id: emote.id,
				scope: 'channel',
				name: emote.code,
				code: emote.code.toLowerCase(),
				userId,
			})
		}

		return result
	}
}
