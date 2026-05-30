import type { EmoteViewModel } from '@shared/models/emotes/emote.view-model.ts'
import type { EmotePickerTab, EmoteScope } from '@shared/types'
import { html } from 'code-tag'
import { Formatter } from '../../../popup/shared/utils/formatter.ts'
import styles from './emote-picker.module.css'

export function renderEmoteSet(
	tab: EmotePickerTab,
	scope: EmoteScope,
	title: string,
	emotes: EmoteViewModel[],
	isCollapsed: boolean,
): string {
	const emotesHtml = emotes
		.map(
			({ type, provider, id, name, url, isFavorite }) => html`<li
					class="${styles.emoteItem}"
					data-name="${name.toLowerCase()}"
				>
					<button
						class="${styles.emoteButton} ${type === 'emote'
							? ''
							: type === 'overlay'
								? styles.overlayEmote
								: styles.modifierEmote} ${tab !== 'favorite' && isFavorite ? styles.favoriteEmote : ''}"
						data-action="picker-emote-click"
						data-provider="${provider}"
						data-type="${type}"
						data-id="${id}"
						data-name="${name}"
						data-scope="${scope}"
						data-tooltip-target="emote"
						aria-label="${name}"
					>
						<img class="${styles.emoteImage}" src="${url}" alt="" loading="lazy" decoding="async" />
					</button>
				</li>`,
		)
		.join('')

	return html`
		<div class="${styles.emoteSet} ${isCollapsed ? styles.emoteSetCollapsed : ''}" data-scope="${scope}">
			<button class="${styles.emoteSetHeader}" type="button">
				<span class="${styles.emoteSetHeaderTitle}">${title}</span>
				<span class="${styles.emoteSetHeaderCount}" data-slot="emote-set-count">${Formatter.formatNumber(emotes.length)}</span>
			</button>
			<div class="${styles.emoteSetContent}">
				<ul class="${styles.emotesList}">
					${emotesHtml}
				</ul>
			</div>
		</div>
	`
}
