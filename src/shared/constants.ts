import { getTwitchClientId } from '@shared/utils/get-twitch-client-id.ts'

export const LOGGER_APPLICATION_NAME = 'BOOSTY_EMOTES'
export const BOOSTY_HOST_NAME = 'boosty.to'
export const BOOSTY_MATCH_URL = 'https://*.boosty.to/*'
export const TWITCH_CLIENT_ID = getTwitchClientId()
export const BOOSTY_USERNAME_REGEX = /^https:\/\/boosty.to\/(?!app)(?<username>\w+)/u

export const BOOSTY_EMOTE_SIZES = [1, 2, 3] as const
export const TWITCH_EMOTE_SIZES = [1, 2, 3] as const
export const StvEmoteSizes = [1, 2, 3, 4] as const
export const FFZ_EMOTE_SIZES = [1, 2, 4] as const
export const BTTV_EMOTE_SIZES = [1, 2, 3] as const
