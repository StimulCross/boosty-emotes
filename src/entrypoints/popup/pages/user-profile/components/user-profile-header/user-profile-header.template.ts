import type { User } from '@shared/models'
import { boostyIconSvg, twitchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import styles from './user-profile-header.module.css'

export function renderUserProfileHeader(user: User): string {
	return html`
		<div
			class="${styles.headerContainer}"
			style="
				background-image: 
					linear-gradient(
						to top,
						var(--bg-primary) 10%,
						color-mix(in srgb, var(--bg-primary), transparent 10%) 30%,
						color-mix(in srgb, var(--bg-primary), transparent 70%) 90%
					),
					url('${user.twitchProfile.banner}');
			"
		>
			<div class="${styles.avatar}">
				<img src="${user.twitchProfile.avatar}" alt="" />
			</div>
			<div class="${styles.usernamesContainer}">
				<div class="${styles.usernameContainer}">
					<span class="${styles.platformIcon} ${styles.twitchIcon}">${twitchIconSvg}</span>
					<a
						href="https://twitch.tv/${user.twitchProfile.name}"
						class="${styles.username}"
						target="_blank"
						title="${user.twitchProfile.displayName}"
					>
						${user.twitchProfile.displayName}
					</a>
				</div>
				<div class="${styles.usernameContainer}">
					<span class="${styles.platformIcon} ${styles.boostyIcon}">${boostyIconSvg}</span>
					<a
						href="https://boosty.to/${user.boostyProfile.name}"
						class="${styles.username}"
						target="_blank"
						title="${user.boostyProfile.name}"
					>
						${user.boostyProfile.name}
					</a>
				</div>
			</div>
		</div>
	`
}
