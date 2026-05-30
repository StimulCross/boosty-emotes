import type { BoostyEmoteSize, EmoteProvider, EmoteSize } from '@shared/types'
import { boostyEmoteUrlsMap } from '@shared/models'

export function getEmoteUrl(provider: EmoteProvider, id: string, size: EmoteSize = 1): string {
	size = size === 4 && provider !== 'stv' && provider !== 'ffz' ? 3 : size

	switch (provider) {
		case 'boosty':
			return boostyEmoteUrlsMap.get(id)?.size[`x${size as BoostyEmoteSize}`] ?? ''

		case 'twitch':
			return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/${size}.0`

		case 'stv':
			return `https://cdn.7tv.app/emote/${id}/${size}x.webp`

		case 'ffz':
			return `https://cdn.frankerfacez.com/emoticon/${id}/${size}`

		case 'bttv':
			return `https://cdn.betterttv.net/emote/${id}/${size}x.webp`

		default:
			return ''
	}
}
