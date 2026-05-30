import type { EmoteAutocompletionMatchType } from '@shared/models'
import { html } from 'code-tag'
import { renderNumberInput } from './components/number-input/number-input.template.ts'
import { renderSelect } from './components/select/select.template.ts'
import { renderSettingRow } from './components/setting-row/setting-row.template.ts'
import { renderToggle } from './components/toggle/toggle.template.ts'
import styles from './settings.module.css'

// eslint-disable-next-line ts/unbound-method
const t = browser.i18n.getMessage

export function renderSettings(): string {
	return html`
		<section class="${styles.group}">
			<h2 class="${styles.groupTitle}">${t('settings_appearance_title')}</h2>
			<div class="${styles.groupContent}">
				${renderSettingRow(
					'theme',
					t('settings_theme_label'),
					renderSelect('theme', [
						{ value: 'auto', label: t('settings_theme_auto') },
						{ value: 'light', label: t('settings_theme_light') },
						{ value: 'dark', label: t('settings_theme_dark') },
					]),
				)}
			</div>
		</section>

		<section class="${styles.group}">
			<h2 class="${styles.groupTitle}">${t('settings_autocompletion_title')}</h2>

			<div class="${styles.groupContent}">
				${renderSettingRow(
					'useTabAutocompletion',
					t('settings_use_tab_autocompletion_label'),
					renderToggle('useTabAutocompletion'),
					t('settings_use_tab_autocompletion_desc'),
				)}
				${renderSettingRow(
					'useColonAutocompletion',
					t('settings_use_colon_autocompletion_label'),
					renderToggle('useColonAutocompletion'),
					t('settings_use_colon_autocompletion_desc'),
				)}
				${renderSettingRow(
					'limit',
					t('settings_limit_label'),
					renderNumberInput('limit', 1, 100),
					t('settings_limit_desc'),
				)}
				${renderSettingRow(
					'matchType',
					t('settings_match_type_label'),
					renderSelect<EmoteAutocompletionMatchType>('matchType', [
						{ value: 'starts-with', label: t('settings_match_type_starts_with') },
						{ value: 'contains', label: t('settings_match_type_contains') },
					]),
					t('settings_match_type_desc'),
					'column',
				)}
				${renderSettingRow(
					'prioritizePrefixMatchedEmotes',
					t('settings_prioritize_prefix_matched_emotes_label'),
					renderToggle('prioritizePrefixMatchedEmotes'),
					t('settings_prioritize_prefix_matched_emotes_desc'),
				)}
				${renderSettingRow(
					'prioritizeFavoriteEmotes',
					t('settings_prioritize_favorite_emotes_label'),
					renderToggle('prioritizeFavoriteEmotes'),
					t('settings_prioritize_favorite_emotes_desc'),
				)}
				${renderSettingRow(
					'sortByPriority',
					t('settings_sort_by_priority_label'),
					renderToggle('sortByPriority'),
					t('settings_sort_by_priority_desc'),
				)}

				<div data-slot="emote-priority-list" style="border-top: none; display: none;"></div>
			</div>
		</section>
	`
}
