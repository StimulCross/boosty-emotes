// https://id.twitch.tv/oauth2/authorize?client_id=1vhiufgkxlf5h4f8r1udn4fvawnk8d&response_type=token%20id_token&redirect_uri=http://localhost/&scope=openid
import { type EmotePickerState } from '@shared/models';
import { type GlobalEmotesState } from '@shared/models/global-emotes-state';

export const LOGGER_APPLICATION_NAME = 'BOOSTY_EMOTES';
export const BOOSTY_HOST_NAME = 'boosty.to';
export const TWITCH_CLIENT_ID = '1vhiufgkxlf5h4f8r1udn4fvawnk8d';
export const WHITE_SPACE_REGEX = /\s+/gu;
export const BOOSTY_USERNAME_REGEX = /^https:\/\/boosty.to\/(?!app)(?<username>[\w\d]+)/u;

export enum StoreKeys {
	Theme = 'theme',
	Identity = 'identity',
	Users = 'users',
	TwitchAccessToken = 'twitch_access_token',
	GlobalEmotesState = 'global_emotes_state',
	EmotePickerState = 'emote_picker_state',
	TwitchGlobalEmotes = 'twitch_global_emotes',
	SevenTvGlobalEmotes = 'stv_global_emotes',
	FfzGlobalEmotes = 'ffz_global_emotes',
	BttvGlobalEmotes = 'bttv_global_emotes',
	TwitchChannelEmotesPrefix = 'twitch_emotes_',
	SevenTvChannelEmotesPrefix = '7tv_emotes_',
	FfzChannelEmotesPrefix = 'ffz_emotes_',
	BttvChannelEmotesPrefix = 'bttv_emotes_'
}

export const defaultGlobalEmotesState: GlobalEmotesState = {
	twitchGlobalEmotesUpdatedAt: 0,
	sevenTvGlobalEmotesUpdatedAt: 0,
	ffzGlobalEmotesUpdatedAt: 0,
	bttvGlobalEmotesUpdatedAt: 0
};

export const defaultEmotePickerState: EmotePickerState = {
	activeTab: 'boosty',
	sets: {
		boosty: {
			collapsed: {
				global: false,
				channel: false
			}
		},
		twitch: {
			collapsed: {
				global: false,
				channel: false
			}
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'7tv': {
			collapsed: {
				global: false,
				channel: false
			}
		},
		ffz: {
			collapsed: {
				global: false,
				channel: false
			}
		},
		bttv: {
			collapsed: {
				global: false,
				channel: false
			}
		}
	}
};
