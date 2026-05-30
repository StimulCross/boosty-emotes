import { View } from '@shared/ui/view.ts'
import styles from './auth.module.css'
import { renderAuth } from './auth.template.ts'

export interface AuthViewProps {
	onAuthRequest: () => Promise<void>
}

export interface AuthViewState {
	isLoading: boolean
}

export class AuthView extends View<AuthViewProps> {
	private _authButton!: HTMLButtonElement

	constructor(props: AuthViewProps) {
		super('div', props, styles.root)

		this._initTemplate()
	}

	public render(state: AuthViewState): void {
		this._authButton.disabled = state.isLoading
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._onClick)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._onClick)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderAuth()

		const authButton = this.$root.querySelector<HTMLButtonElement>('[data-type="auth"]')

		if (!authButton)
			throw new Error('Auth button not found')

		this._authButton = authButton
	}

	private readonly _onClick = (event: MouseEvent): void => {
		const target = event.target as HTMLElement
		const authBtn = target.closest<HTMLButtonElement>('[data-type="auth"]')

		if (authBtn && !authBtn.disabled)
			void this._props.onAuthRequest()
	}
}
