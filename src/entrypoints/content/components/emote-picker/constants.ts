import type { EmoteProvider } from '@shared/types'
import {
	boostyIconSvg,
	bttvIconSvg,
	favoriteIconSvg,
	ffzIconSvg,
	stvIconSvg,
	twitchIconSvg,
} from '@shared/ui/assets/svg'
import styles from './emote-picker.module.css'

export type EmotePickerTab = EmoteProvider | 'favorite'

export const EMOTE_PICKER_TABS: EmotePickerTab[] = ['favorite', 'boosty', 'twitch', 'stv', 'ffz', 'bttv'] as const

export function isValidEmotePickerTab(tab: string): tab is EmotePickerTab {
	return EMOTE_PICKER_TABS.includes(tab as EmotePickerTab)
}

export const PROVIDER_TO_ICON_MAP: Record<EmotePickerTab, string> = {
	favorite: favoriteIconSvg,
	boosty: boostyIconSvg,
	twitch: twitchIconSvg,
	stv: stvIconSvg,
	ffz: ffzIconSvg,
	bttv: bttvIconSvg,
}

export const PROVIDER_TO_NAME_MAP: Record<EmotePickerTab, string> = {
	favorite: browser.i18n.getMessage('favorite_tab_title'),
	boosty: 'BOOSTY',
	twitch: 'TWITCH',
	stv: '7TV',
	ffz: 'FFZ',
	bttv: 'BTTV',
}

export const PROVIDER_TO_TAB_CLASS_MAP: Record<EmotePickerTab, string> = {
	favorite: styles.tabFavorite,
	boosty: styles.tabBoosty,
	twitch: styles.tabTwitch,
	stv: styles.tabStv,
	ffz: styles.tabFfz,
	bttv: styles.tabBttv,
}
