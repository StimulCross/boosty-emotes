import type {
	BOOSTY_EMOTE_SIZES,
	BTTV_EMOTE_SIZES,
	FFZ_EMOTE_SIZES,
	StvEmoteSizes,
	TWITCH_EMOTE_SIZES,
} from '@shared/constants.ts'
import type { Emote } from '@shared/models'

export type EmoteType = 'emote' | 'overlay' | 'modifier'

export const THIRD_PARTY_EMOTE_PROVIDERS = ['twitch', 'stv', 'ffz', 'bttv'] as const
export type ThirdPartyEmoteProvider = typeof THIRD_PARTY_EMOTE_PROVIDERS[number]

export const EMOTE_PROVIDERS = ['boosty', ...THIRD_PARTY_EMOTE_PROVIDERS] as const
export type EmoteProvider = typeof EMOTE_PROVIDERS[number]

export const EMOTE_SCOPES = ['global', 'channel'] as const
export type EmoteScope = typeof EMOTE_SCOPES[number]

export type BoostyEmoteSize = (typeof BOOSTY_EMOTE_SIZES)[number]
export type TwitchEmoteSize = (typeof TWITCH_EMOTE_SIZES)[number]
export type StvEmoteSize = (typeof StvEmoteSizes)[number]
export type FfzEmoteSize = (typeof FFZ_EMOTE_SIZES)[number]
export type BttvEmoteSize = (typeof BTTV_EMOTE_SIZES)[number]

export type EmoteSize = 1 | 2 | 3 | 4

export type EmoteMap<TEmote extends Emote = Emote> = Map<string, TEmote>
