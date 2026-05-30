import { boostyIconSvg, twitchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import buttonStyles from '../../../../shared/styles/button.module.css'
import styles from './add-user-form.module.css'

export function renderAddUserForm(): string {
	return html`
		<form method="post">
			<div class="${styles.platformInput}">
				<span class="${styles.platformIcon} ${styles.twitchIcon}">${twitchIconSvg}</span>
				<input
					name="twitch-username"
					placeholder="${browser.i18n.getMessage('add_user_twitch_input_placeholder')}"
					class="${styles.usernameInput}"
					type="text"
				/>
			</div>
			<div class="${styles.platformInput}">
				<span class="${styles.platformIcon} ${styles.boostyIcon}">${boostyIconSvg}</span>
				<input
					name="boosty-username"
					placeholder="${browser.i18n.getMessage('add_user_boosty_input_placeholder')}"
					class="${styles.usernameInput}"
					type="text"
				/>
			</div>
			<button
				type="submit"
				class="${buttonStyles.root} ${buttonStyles.medium} ${buttonStyles.primary} ${styles.inputButton}"
			>
				${browser.i18n.getMessage('add_user_add_button')}
			</button>
		</form>
		<div class="${styles.errorMessageContainer}">
			<span class="${styles.errorMessage}"></span>
		</div>
	`
}
