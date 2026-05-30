import { twitchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import buttonStyles from '../../shared/styles/button.module.css'
import styles from './auth.module.css'

export function renderAuth(): string {
	return html`
		<div class="${styles.content}">
			<header class="${styles.header}">
				<h1 class="${styles.title}">Boosty Emotes</h1>
				<p class="${styles.description}">
					${browser.i18n.getMessage('auth_description')}
				</p>
			</header>

			<div class="${styles.disclaimerBox}">
				<h2 class="${styles.disclaimerTitle}">
					${browser.i18n.getMessage('auth_why_login_title')}
				</h2>
				<p class="${styles.disclaimerText}">
					${browser.i18n.getMessage('auth_why_login_text')}
				</p>
				<p class="${styles.disclaimerHighlight}">
					${browser.i18n.getMessage('auth_any_account_text')}
				</p>
			</div>

			<button
				type="button"
				class="${buttonStyles.root} ${buttonStyles.secondary} ${buttonStyles.large} ${styles.authButton}"
				data-type="auth"
			>
				<span class="${styles.twitchIcon}">${twitchIconSvg}</span>
				${browser.i18n.getMessage('auth_button')}
			</button>
		</div>
	`
}
