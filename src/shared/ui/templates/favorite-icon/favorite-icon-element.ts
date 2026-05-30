import { favoriteIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import styles from './favorite-icon.module.css'

export const favoriteIconElement = html`
	<div class="${styles.favoriteIcon}">${favoriteIconSvg}</div>
`

export function createFavoriteIconElement(className: string): string {
	return html`<div class="${styles.favoriteIcon} ${className}">${favoriteIconSvg}</div>`
}
