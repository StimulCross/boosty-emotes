export function createFavoriteIcon(): HTMLElement {
	const favoriteIcon = document.createElement('figure');
	favoriteIcon.classList.add('favorite-icon', 'star-icon');
	return favoriteIcon;
}
