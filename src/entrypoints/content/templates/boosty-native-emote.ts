import type { GlobalBoostyEmote } from '@shared/models'
import { getEmoteUrl } from '@shared/utils'
import styles from './emote/emote.module.css'

export function createBoostyNativeEmote(emote: GlobalBoostyEmote): HTMLImageElement {
	const img = document.createElement('img')

	img.translate = false
	img.className = styles.emote
	img.alt = emote.name
	img.src = getEmoteUrl(emote.provider, emote.id)

	img.dataset.type = 'smile'
	img.dataset.provider = emote.provider
	img.dataset.id = emote.id
	img.dataset.tooltip = 'true'

	img.loading = 'lazy'
	img.decoding = 'async'

	return img
}
