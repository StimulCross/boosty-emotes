import type { EmoteViewModel } from '@shared/models'
import type { EmoteProvider } from '@shared/types'
import { boostyIconSvg, bttvIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/ui'
import { createFavoriteIconElement } from '@shared/ui/templates/favorite-icon/favorite-icon-element.ts'
import { html } from 'code-tag'
import styles from './emote-autocompletion.module.css'

function getProviderIconClassName(provider: EmoteProvider): string {
	switch (provider) {
		case 'boosty':
			return styles.boostyIcon

		case 'twitch':
			return styles.twitchIcon

		case 'stv':
			return styles.sevenTvIcon

		case 'ffz':
			return styles.ffzIcon

		case 'bttv':
			return styles.bttvIcon

		default:
			throw new Error(`Unknown provider: ${String(provider)}`)
	}
}

function getProviderIcon(provider: EmoteProvider): string {
	switch (provider) {
		case 'boosty':
			return boostyIconSvg

		case 'twitch':
			return twitchIconSvg

		case 'stv':
			return stvIconSvg

		case 'ffz':
			return ffzIconSvg

		case 'bttv':
			return bttvIconSvg

		default:
			throw new Error(`Unknown provider: ${String(provider)}`)
	}
}

export function renderEmoteAutocompletionMatch(emote: EmoteViewModel, query: string): string {
	const highlightedEmoteName = emote.name.replace(new RegExp(query, 'iu'), match => html`<mark>${match}</mark>`)

	return html`
		<li
			data-item-type="emote-autocompletion-match"
			data-provider="${emote.provider}"
			data-id="${emote.id}"
			data-name="${emote.name}"
			data-scope="${emote.scope}"
		>
			<button type="button" class="${styles.match}">
				<figure class="${styles.emote}">
					<img
						class="${styles.emoteImage}"
						src="${emote.url}"
						alt="${emote.name}"
						loading="lazy"
						decoding="async"
					/>
					${emote.isFavorite ? createFavoriteIconElement(styles.favoriteIcon) : ''}
				</figure>
				<span class="${styles.emoteName}" title="${emote.name}">${highlightedEmoteName}</span>
				<span class="${styles.providerIcon} ${getProviderIconClassName(emote.provider)}"
					>${getProviderIcon(emote.provider)}</span
				>
			</button>
		</li>
	`
}
