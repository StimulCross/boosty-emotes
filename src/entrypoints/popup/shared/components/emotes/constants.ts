import type { ThirdPartyEmoteProvider } from '@shared/types'
import { bttvIconSvg, favoriteIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/ui/assets/svg'
import styles from './emotes.module.css'

export type EmoteTab = ThirdPartyEmoteProvider | 'favorite'

export const EMOTE_TABS: EmoteTab[] = ['favorite', 'twitch', 'stv', 'ffz', 'bttv'] as const

export const PROVIDER_TO_ICON_MAP: Record<EmoteTab, string> = {
	favorite: favoriteIconSvg,
	twitch: twitchIconSvg,
	stv: stvIconSvg,
	ffz: ffzIconSvg,
	bttv: bttvIconSvg,
}

export const PROVIDER_TO_NAME_MAP: Record<EmoteTab, string> = {
	favorite: browser.i18n.getMessage('favorite_tab_title'),
	twitch: 'TWITCH',
	stv: '7TV',
	ffz: 'FFZ',
	bttv: 'BTTV',
}

export const PROVIDER_TO_TAB_CLASS_MAP: Record<EmoteTab, string> = {
	favorite: styles.tabFavorite,
	twitch: styles.tabTwitch,
	stv: styles.tabStv,
	ffz: styles.tabFfz,
	bttv: styles.tabBttv,
}
