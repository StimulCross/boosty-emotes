import { View } from '@shared/ui/view.ts'
import animationStyles from '../../shared/styles/animations.module.css'
import { renderAddUser } from './add-user.template.ts'

export class AddUserView extends View {
	private _form!: HTMLElement

	constructor() {
		super('div', {}, animationStyles.contentFadeIn)

		this._initTemplate()
	}

	public get formSlot(): HTMLElement {
		return this._form
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderAddUser()

		const form = this.$root.querySelector<HTMLElement>('[data-slot=form]')

		if (!form)
			throw new Error('Add user template is invalid')

		this._form = form
	}
}
