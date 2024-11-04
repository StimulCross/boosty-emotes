// https://id.twitch.tv/oauth2/authorize?client_id=1vhiufgkxlf5h4f8r1udn4fvawnk8d&response_type=token%20id_token&redirect_uri=http://localhost/&scope=openid
import { type EmotePickerState } from '@shared/models';
import { type GlobalEmotesState } from '@shared/models/global-emotes-state';

export const LOGGER_APPLICATION_NAME = 'BOOSTY_EMOTES';
export const BOOSTY_HOST_NAME = 'boosty.to';
export const TWITCH_CLIENT_ID = '1vhiufgkxlf5h4f8r1udn4fvawnk8d';
export const WHITE_SPACE_REGEX = /\s+/gu;
export const BOOSTY_USERNAME_REGEX = /^https:\/\/boosty.to\/(?!app)(?<username>[\w\d]+)/u;

export const STORE_KEYS = {
	THEME: 'theme',
	IDENTITY: 'identity',
	USERS: 'users',
	TWITCH_ACCESS_TOKEN: 'twitch_access_token',
	GLOBAL_EMOTES_STATE: 'global_emotes_state',
	EMOTE_PICKER_STATE: 'emote_picker_state',
	TWITCH_GLOBAL_EMOTES: 'twitch_global_emotes',
	SEVEN_TV_GLOBAL_EMOTES: 'stv_global_emotes',
	FFZ_GLOBAL_EMOTES: 'ffz_global_emotes',
	BTTV_GLOBAL_EMOTES: 'bttv_global_emotes',
	TWITCH_CHANNEL_EMOTES_PREFIX: 'twitch_emotes_',
	SEVEN_TV_CHANNEL_EMOTES_PREFIX: '7tv_emotes_',
	FFZ_CHANNEL_EMOTES_PREFIX: 'ffz_emotes_',
	BTTV_CHANNEL_EMOTES_PREFIX: 'bttv_emotes_'
};

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
