import type { Theme } from '@shared/types'

export function setTheme(theme: Theme): void {
	if (theme === 'auto')
		delete document.documentElement.dataset.theme

	else
		document.documentElement.dataset.theme = theme
}
