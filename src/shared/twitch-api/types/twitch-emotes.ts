export type TwitchEmoteFormat = 'static' | 'animated';
export type TwitchEmoteScale = '1.0' | '2.0' | '3.0';
export type TwitchThemeMode = 'light' | 'dark';
export type TwitchEmoteType = 'bitstier' | 'follower' | 'subscriptions';

export interface TwitchGlobalEmoteData {
	id: string;
	name: string;
	images: {
		url_1x: string;
		url_2x: string;
		url_4x: string;
	};
	format: TwitchEmoteFormat[];
	scale: TwitchEmoteScale[];
	theme_mode: TwitchThemeMode[];
}

export interface TwitchChannelEmoteData {
	id: string;
	name: string;
	images: {
		url_1x: string;
		url_2x: string;
		url_4x: string;
	};
	tier: string;
	emote_type: TwitchEmoteType;
	emote_set_id: string;
	format: TwitchEmoteFormat[];
	scale: TwitchEmoteScale[];
	theme_mode: TwitchThemeMode[];
}
