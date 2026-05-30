import type { Controller } from '../index.ts'
import { AuthView } from './auth.view.ts'

export interface AuthControllerOptions {
	onLogin: () => Promise<void>
}

export class AuthController implements Controller {
	private readonly _view: AuthView

	constructor(private readonly _options: AuthControllerOptions) {
		this._view = new AuthView({ onAuthRequest: async () => await this._handleAuthRequest() })
	}

	public mount(container: HTMLElement): void {
		this._view.mount(container)
	}

	public unmount(): void {
		this._view.unmount()
	}

	private async _handleAuthRequest(): Promise<void> {
		this._view.render({ isLoading: true })

		try {
			await this._options.onLogin()
		}
		finally {
			this._view.render({ isLoading: false })
		}
	}
}
