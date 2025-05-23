import { type Emote } from '@shared/models';

export type ThirdPartyEmoteProvider = 'twitch' | '7tv' | 'ffz' | 'bttv';
export type EmoteProvider = 'boosty' | ThirdPartyEmoteProvider;
export type EmoteScope = 'global' | 'channel';

export type BoostyEmoteSize = 1 | 2 | 3;
export type TwitchEmoteSize = 1 | 2 | 3;
export type SevenTvEmoteSize = 1 | 2 | 3 | 4;
export type FfzEmoteSize = 1 | 2 | 4;
export type BttvEmoteSize = 1 | 2 | 3;
export type EmoteSize = 1 | 2 | 4;

export type EmotesSet = Map<string, Emote>;
export type ProviderEmotesSets = Map<EmoteProvider, EmotesSet>;
export type ThirdPartyProviderEmotesSets = Map<ThirdPartyEmoteProvider, EmotesSet>;
export type ScopesEmotesSets = Map<EmoteScope, ProviderEmotesSets>;
