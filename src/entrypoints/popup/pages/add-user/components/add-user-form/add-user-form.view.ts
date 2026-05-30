import { View } from '@shared/ui/view.ts'
import styles from './add-user-form.module.css'
import { renderAddUserForm } from './add-user-form.template.ts'

export interface AddUserFormViewState {
	error: string | null
	isLoading: boolean
}

export interface AddUserFormViewProps {
	onSubmit: (twitchUsername: string, boostyUsername: string) => Promise<void>
}

export class AddUserFormView extends View<AddUserFormViewProps> {
	private _twitchInput!: HTMLInputElement
	private _boostyInput!: HTMLInputElement
	private _errorMessageContainer!: HTMLElement
	private _addButton!: HTMLButtonElement
	private _form!: HTMLFormElement

	constructor(props: AddUserFormViewProps) {
		super('div', props, styles.root)

		this._initTemplate()
	}

	public render(state: AddUserFormViewState): void {
		this._errorMessageContainer.textContent = state.error ?? ''
		this._addButton.disabled = state.isLoading
	}

	public setBoostyUsername(username: string): void {
		if (!this._boostyInput.value)
			this._boostyInput.value = username
	}

	protected override _bindEvents(): void {
		this._form.addEventListener('submit', this._onSubmit)
	}

	protected override _unbindEvents(): void {
		this._form.removeEventListener('submit', this._onSubmit)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderAddUserForm()

		const twitchInput = this.$root.querySelector<HTMLInputElement>('[name="twitch-username"]')
		const boostyInput = this.$root.querySelector<HTMLInputElement>('[name="boosty-username"]')
		const errorMessageContainer = this.$root.querySelector<HTMLElement>(`.${styles.errorMessage}`)
		const addButton = this.$root.querySelector<HTMLButtonElement>(`.${styles.inputButton}`)
		const form = this.$root.querySelector<HTMLFormElement>('form')

		if (!twitchInput || !boostyInput || !errorMessageContainer || !addButton || !form)
			throw new Error('Add user form template is invalid')

		this._twitchInput = twitchInput
		this._boostyInput = boostyInput
		this._errorMessageContainer = errorMessageContainer
		this._addButton = addButton
		this._form = form
	}

	private readonly _onSubmit = (evt: SubmitEvent): void => {
		evt.preventDefault()

		const twitchInput = this._twitchInput.value.trim()
		const boostyInput = this._boostyInput.value.trim()

		void this._props.onSubmit(twitchInput, boostyInput)
	}
}
