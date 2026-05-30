import { View } from '@shared/ui/view.ts'
import animationStyles from '../../shared/styles/animations.module.css'
import styles from './user-profile.module.css'
import { renderUserProfile } from './user-profile.ṫemplate.ts'

export class UserProfileView extends View {
	private _profileHeaderSlot!: HTMLElement
	private _emotesSlot!: HTMLElement

	constructor() {
		super('div', {}, [styles.root, animationStyles.contentFadeIn])

		this._initTemplate()
	}

	public get headerSlot(): HTMLElement {
		return this._profileHeaderSlot
	}

	public get emotesSlot(): HTMLElement {
		return this._emotesSlot
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderUserProfile()

		const profileHeader = this.$root.querySelector<HTMLElement>('[data-slot=profile-header]')
		const emotes = this.$root.querySelector<HTMLElement>('[data-slot=emotes]')

		if (!profileHeader || !emotes)
			throw new Error('User profile template is invalid')

		this._profileHeaderSlot = profileHeader
		this._emotesSlot = emotes
	}
}
