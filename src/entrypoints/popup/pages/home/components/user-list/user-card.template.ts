import type { User } from '@shared/models'
import { boostyIconSvg, twitchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import styles from './user-list.module.css'

export function renderUserCard({ boostyProfile, twitchProfile }: User): string {
	return html`
		<li class="${styles.userCard}" data-twitch-user-id="${twitchProfile.id}">
			<div class="${styles.avatar}">
				<img src="${twitchProfile.avatar}" alt="" />
			</div>

			<div class="${styles.userCardBody}" style="--card-banner: url('${twitchProfile.banner}') !important">
				<div class="${styles.usernamesContainer}">
					<div class="${styles.usernameContainer}">
						<span class="${styles.platformIcon} ${styles.twitchIcon}">${twitchIconSvg}</span>
						<span class="${styles.username}" title="${twitchProfile.displayName}"
							>${twitchProfile.displayName}</span
						>
					</div>
					<div class="${styles.usernameContainer}">
						<span class="${styles.platformIcon} ${styles.boostyIcon}">${boostyIconSvg}</span>
						<span class="${styles.username}" title="${boostyProfile.name}">${boostyProfile.name}</span>
					</div>
				</div>
				<button 
					type="button" 
					class="${styles.deleteButton}" 
					data-action="delete-user"
					title="${browser.i18n.getMessage('home_page_delete_user_button_title')}">
						<span class="material-symbols-rounded ${styles.deleteButtonChevronIcon}">chevron_left</span>
						<span class="material-symbols-rounded ${styles.deleteButtonIcon}">delete</span>
				</button>
			</div>
		</li>`
}
