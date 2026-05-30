import type { EmoteProvider, EmoteScope, EmoteType } from '@shared/types'
import { boostyIconSvg, bttvIconSvg, favoriteIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/ui'
import { html } from 'code-tag'
import styles from './emote-tooltip.module.css'

const PROVIDER_ICONS_MAP: Record<EmoteProvider, string> = {
	boosty: boostyIconSvg,
	twitch: twitchIconSvg,
	stv: stvIconSvg,
	ffz: ffzIconSvg,
	bttv: bttvIconSvg,
}

const PROVIDER_ICON_CLASS_MAP: Record<EmoteProvider, string> = {
	boosty: styles.boostyIcon,
	twitch: styles.twitchIcon,
	stv: styles.stvIcon,
	ffz: styles.ffzIcon,
	bttv: styles.bttvIcon,
}

export interface EmoteTooltipEmoteData {
	provider: EmoteProvider
	id: string
	name: string
	type?: EmoteType
	scope?: EmoteScope
	isFavorite?: boolean
}

export interface EmoteTooltipProps {
	url: string
	emoteData: EmoteTooltipEmoteData
	width?: string
	height?: string
	modifiers?: Array<{ name: string, url: string }>
}

export function renderEmoteTooltip({ url, emoteData: { provider, name, type, scope, isFavorite }, width, height, modifiers }: EmoteTooltipProps,	themeStyle: string): string {
	return html`
		<div class="${themeStyle || styles.tooltipTheme} ${styles.root}">
		<img
			class="${styles.image}"
			alt="${name}"
			src="${url}"
			width="${width || 'auto'}"
			height="${height || 'auto'}"
			sizes="auto"
		/>

		<div class="${styles.nameContainer}">
			<span class="${styles.name}">${name}</span>
			<span class="${styles.providerIcon} ${PROVIDER_ICON_CLASS_MAP[provider]}">
				${PROVIDER_ICONS_MAP[provider]}
			</span>
		</div>

		${scope
			? `<span class="${styles.scope}"
			>${browser.i18n.getMessage(scope === 'global' ? 'tooltip_global_emote_title' : 'tooltip_channel_emote_title')}</span
		>`
			: ''}
		${isFavorite
			? html`<div class="${styles.favoriteContainer}">
						<span class="${styles.favoriteText}"
							>${browser.i18n.getMessage('tooltip_favorite_emote_title')}</span
						>
						${favoriteIconSvg}
					</div> `
			: ''}
		${type && type === 'emote'
			? ''
			: html`<span class="${styles.type} ${type === 'overlay' ? styles.overlayType : styles.modifierType}"
						>${browser.i18n.getMessage(
							type === 'overlay' ? 'tooltip_overlay_emote_title' : 'tooltip_modifier_emote_title',
						)}</span
					>`}
		${modifiers && modifiers.length > 0
			? html`
			<div class="${styles.divider}"></div>
					<div class="${styles.modifiersList}">
						${modifiers
							.map(
								m => html`
					<div class="${styles.modifierItem}">
										<img
											src="${m.url}"
											class="${styles.modifierImage}"
											alt="${m.name}"
											loading="lazy"
											decoding="async"
										/>
										<span class="${styles.modifierName}">— ${m.name}</span>
									</div>
				`,
							)
							.join('')}
					</div>
		`
			: ''}
	</div>
`
}
