import type { EmoteViewModel } from '@shared/models/emotes/emote.view-model.ts'
import type { EmoteTab } from './constants.ts'
import { html } from 'code-tag'
import scrollStyles from '../../styles/scroll-container-y.module.css'
import { Formatter } from '../../utils/formatter.ts'
import styles from './emotes.module.css'

export function renderEmoteSet(tab: EmoteTab, emotes: EmoteViewModel[], total: number, updatedAt: Date): string {
	const emotesHtml = emotes
		.map(
			({ type, provider, id, name, url, isFavorite }) => html`<li data-name="${name.toLowerCase()}">
					<button
						class="${styles.emoteButton} ${type === 'emote'
							? ''
							: type === 'overlay'
								? styles.overlayEmote
								: styles.modifierEmote} ${tab !== 'favorite' && isFavorite ? styles.favoriteEmote : ''}"
						data-action-type="emote-button"
						data-type="${type}"
						data-provider="${provider}"
						data-id="${id}"
						data-name="${name}"
						data-tooltip-target="emote"
						aria-label="${name}"
					>
						<img class="${styles.emote}" src="${url}" alt="" loading="lazy" decoding="async" />
					</button>
				</li>`,
		)
		.join('')

	return html`
		<div class="${styles.emoteSet} ${styles.emoteSetShow}">
			<div class="${styles.emoteSetContainer}">
				<ul class="${styles.emoteStats}">
					<li class="${styles.emotesStatsItem}">
						${browser.i18n.getMessage('emote_stats_total_emotes')}:
						<span data-slot="total-emotes">${Formatter.formatNumber(total)}</span>
					</li>
					<li class="${styles.emotesStatsItem}">
						${browser.i18n.getMessage('emote_stats_updated_at')}: ${Formatter.formatDate(updatedAt)}
					</li>
				</ul>
				<ul class="${styles.emotes} ${scrollStyles.scrollContainerY}">
					${emotesHtml}
				</ul>
			</div>
		</div>
	`
}
