import type { TwitchApiCallType } from '@shared/twitch-api/utils/twitch-api-call-options'

const BEGINNING_SLASH_REGEX = /^\//u

export function normalizeTwitchUrl(url: string, type: TwitchApiCallType = 'api'): string {
	return `${type === 'api'
		? 'https://api.twitch.tv/helix/'
		: 'https://id.twitch.tv/oauth2/'
	}${url.replace(BEGINNING_SLASH_REGEX, '')}`
}
