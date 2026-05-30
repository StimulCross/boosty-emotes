import type { BttvChannelEmoteData } from './emote/bttv-channel-emote-data.ts'
import type { BttvSharedEmoteData } from './emote/bttv-shared-emote-data.ts'

export interface BttvChannelEmotesData {
	id: string
	bots: string[]
	avatar: string
	channelEmotes: BttvChannelEmoteData[]
	sharedEmotes: BttvSharedEmoteData[]
}
