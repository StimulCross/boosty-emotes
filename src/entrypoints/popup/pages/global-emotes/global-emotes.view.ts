import { View } from '@shared/ui/view.ts'
import animationStyles from '../../shared/styles/animations.module.css'
import { renderGlobalEmotes } from './global-emotes.template.ts'

export class GlobalEmotesLayout extends View {
	private _emotesSlot!: HTMLElement

	constructor() {
		super('div', {}, animationStyles.contentFadeIn)

		this._initTemplate()
	}

	public get emotesSlot(): HTMLElement {
		return this._emotesSlot
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderGlobalEmotes()

		const emotes = this.$root.querySelector<HTMLElement>('[data-slot=emotes]')

		if (!emotes)
			throw new Error('Global emotes template is invalid')

		this._emotesSlot = emotes
	}
}
