import type { EmoteProvider, EmoteScope, ThirdPartyEmoteProvider } from '@shared/types'

export interface FavoriteEmoteBase<TScope extends EmoteScope, TProvider extends EmoteProvider = EmoteProvider> {
	provider: TProvider
	id: string
	scope: TScope
}

export type GlobalFavoriteEmote = FavoriteEmoteBase<'global'>
export type ChannelFavoriteEmote = FavoriteEmoteBase<'channel', ThirdPartyEmoteProvider>

export type FavoriteEmote = GlobalFavoriteEmote | ChannelFavoriteEmote
