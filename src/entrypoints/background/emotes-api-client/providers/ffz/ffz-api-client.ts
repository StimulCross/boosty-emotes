import type { ChannelFfzEmote, GlobalFfzEmote } from '@shared/models'
import type { FfzEmoteData } from './data/emote/ffz-emote-data.ts'
import type { FfzGlobalEmotesData } from './data/ffz-global-emotes.ts'
import type { FfzRoomWithSetsData } from './data/ffz-room-with-sets.ts'

export class FfzApiClient {
	public async getGlobalEmotes(): Promise<GlobalFfzEmote[]> {
		const response = await fetch('https://api.frankerfacez.com/v1/set/global')

		if (!response.ok) {
			throw new Error(
				`Failed to fetch FFZ global emotes; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as FfzGlobalEmotesData

		const result: FfzEmoteData[] = []

		for (const [, set] of Object.entries(data.sets))
			result.push(...set.emoticons)

		return result.map(
			emote =>
				({
					type: emote.modifier ? 'modifier' : 'emote',
					provider: 'ffz',
					id: String(emote.id),
					scope: 'global',
					name: emote.name,
					code: emote.name.toLowerCase(),
					flags: emote.modifier_flags,
					isHidden: emote.hidden,
				}) satisfies GlobalFfzEmote,
		)
	}

	public async getChannelEmotes(userId: string): Promise<ChannelFfzEmote[]> {
		const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${userId}`)

		if (!response.ok) {
			if (response.status === 404)
				return []

			throw new Error(
				`Failed to fetch FFZ channel emotes for user: ${userId}; status: ${response.status}; text: ${response.statusText}`,
			)
		}

		const data = (await response.json()) as FfzRoomWithSetsData

		const result: FfzEmoteData[] = []

		for (const [, set] of Object.entries(data.sets))
			result.push(...set.emoticons)

		return result.map(
			emote =>
				({
					type: emote.modifier ? 'modifier' : 'emote',
					provider: 'ffz',
					id: String(emote.id),
					scope: 'channel',
					name: emote.name,
					code: emote.name.toLowerCase(),
					userId,
					flags: emote.modifier_flags,
					isHidden: emote.hidden,
				}) satisfies ChannelFfzEmote,
		)
	}
}
