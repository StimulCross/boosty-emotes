import type { EmoteProvider, EmoteScope, EmoteType, ThirdPartyEmoteProvider } from '../../types'

export interface EmoteBase {
	type: EmoteType
	provider: EmoteProvider
	scope: EmoteScope
	id: string
	name: string
	code: string // lower case name
	flags?: number
	isHidden?: boolean
	userId?: string
	usageCount?: number
}

export interface GlobalEmoteBase<TProvider extends EmoteProvider> extends EmoteBase {
	provider: TProvider
	scope: Extract<EmoteScope, 'global'>
}

export interface ChannelEmoteBase<TProvider extends ThirdPartyEmoteProvider> extends EmoteBase {
	provider: TProvider
	scope: Extract<EmoteScope, 'channel'>
	userId: string
}

export type GlobalBoostyEmote = GlobalEmoteBase<'boosty'>

export type GlobalTwitchEmote = GlobalEmoteBase<'twitch'>
export type ChannelTwitchEmote = ChannelEmoteBase<'twitch'>
export type TwitchEmote = GlobalTwitchEmote | ChannelTwitchEmote

export type GlobalStvEmote = GlobalEmoteBase<'stv'>
export type ChannelStvEmote = ChannelEmoteBase<'stv'>
export type StvEmote = GlobalStvEmote | ChannelStvEmote

export type GlobalFfzEmote = GlobalEmoteBase<'ffz'>
export type ChannelFfzEmote = ChannelEmoteBase<'ffz'>
export type FfzEmote = GlobalFfzEmote | ChannelFfzEmote

export type GlobalBttvEmote = GlobalEmoteBase<'bttv'>
export type ChannelBttvEmote = ChannelEmoteBase<'bttv'>
export type BttvEmote = GlobalBttvEmote | ChannelBttvEmote

export type GlobalThirdPartyEmote = GlobalTwitchEmote | GlobalStvEmote | GlobalFfzEmote | GlobalBttvEmote
export type GlobalEmote = GlobalBoostyEmote | GlobalThirdPartyEmote

export type ChannelEmote = ChannelTwitchEmote | ChannelStvEmote | ChannelFfzEmote | ChannelBttvEmote

export type ThirdPartyEmote = GlobalThirdPartyEmote | ChannelEmote
export type Emote = GlobalEmote | ChannelEmote
