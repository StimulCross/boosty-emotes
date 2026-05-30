import { html } from 'code-tag'
import styles from './footer.module.css'

export function renderFooter(): string {
	return html`
		<ul class="${styles.social}">
			<li class="${styles.socialItem}">
				<a class="${styles.socialLink}" href="https://github.com/StimulCross/boosty-emotes" target="_blank">
					<img class="${styles.socialIcon}" src="../../images/github-32.png" alt="GitHub" />
					<span class="${styles.socialName}">GitHub</span></a
				>
			</li>
		</ul>
	`
}
