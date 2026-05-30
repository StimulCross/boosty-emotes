import styles from './favorite-icon.module.css'

export function createFavoriteIcon(): HTMLElement {
	const favoriteIcon = document.createElement('figure')
	favoriteIcon.classList.add(styles.favoriteIcon, styles.starIcon)

	return favoriteIcon
}
