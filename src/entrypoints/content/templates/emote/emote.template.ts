import type { EmoteViewModel } from '@shared/models/emotes/emote.view-model.ts'
import { html } from 'code-tag'
import styles from './emote.module.css'
import { FFZ_EFFECT_CLASS, parseFfzFlags } from './ffz-effects.ts'

export function renderEmoteButton(baseEmote: EmoteViewModel, modifiers: EmoteViewModel[] = []): string {
	let ffzFlags: number = 0

	for (const modifier of modifiers) {
		if (modifier.type === 'modifier' && modifier.provider === 'ffz' && modifier.flags)
			ffzFlags = ffzFlags | modifier.flags
	}

	const baseImg = html`
		<img
			class="${styles.emote} ${ffzFlags > 0 ? `${FFZ_EFFECT_CLASS} ${parseFfzFlags(ffzFlags).map(e => e.cssClass).join(' ')}` : ''}"
			src="${baseEmote.url}"
			alt="${baseEmote.name}"
			data-type="${baseEmote.type}"
			loading="lazy"
			decoding="async"
		/>
	`

	const modifierImgs = modifiers
		.map(
			modifier => html`
			<img
					class="${modifier.type === 'overlay' ? styles.overlay : styles.modifier}"
					src="${modifier.url}"
					alt="${modifier.name}"
					data-type="${modifier.type}"
					data-id="${modifier.id}"
					data-name="${modifier.name}"
					data-provider="${modifier.provider}"
					loading="lazy"
					decoding="async"
				/>
		`,
		)
		.join('')

	return html`
		<button
			class="${styles.emoteBox}"
			type="button"
			data-action="page-emote-click"
			data-provider="${baseEmote.provider}"
			data-type="${baseEmote.type}"
			data-id="${baseEmote.id}"
			data-name="${baseEmote.name}"
			data-scope="${baseEmote.scope}"
			data-is-favorite="${baseEmote.isFavorite ? 'true' : ''}"
			data-tooltip-target="emote"
			aria-label="${baseEmote.name}"
		>
			${baseImg} ${modifierImgs}
		</button>
	`
}
