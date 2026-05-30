import { html } from 'code-tag'
import styles from './header.module.css'

export function renderHeader(): string {
	return html`
		<button class="${styles.backButton}">
			<span class="material-symbols-rounded ${styles.backButtonIcon}">arrow_back</span>
			<span class="${styles.backButtonText}">${browser.i18n.getMessage('header_back_button')}</span>
		</button>

		<div class="${styles.userIdentity}">
			<div class="${styles.identity}">
				<img class="${styles.avatar}" alt="Avatar" />
				<span class="${styles.username}"></span>
			</div>

			<button class="${styles.menuButton}">
				<span class="material-symbols-rounded">more_vert</span>
			</button>

			<div class="${styles.menu}">
				<ul class="${styles.menuList}">
					<li class="${styles.menuListItem}" data-action="settings">
						${browser.i18n.getMessage('header_settings')}
					</li>
					<li class="${styles.menuListItem}" data-action="global_emotes">
						${browser.i18n.getMessage('header_global_emotes')}
					</li>
					<li class="${styles.menuListItem} ${styles.menuListItemCrit}" data-action="logout">
						${browser.i18n.getMessage('header_logout')}
					</li>
				</ul>
			</div>
		</div>
	`
}
