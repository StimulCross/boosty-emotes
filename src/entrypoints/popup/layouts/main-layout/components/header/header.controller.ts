import type { TwitchUser } from '@shared/models'
import type { Controller } from '@shared/ui'
import type { Logger } from '@stimulcross/logger'
import type { HeaderMode, HeaderViewState } from './header.view.ts'
import { createAppLogger } from '@shared/utils'
import { HeaderView } from './header.view.ts'

export interface HeaderControllerOptions {
	onNavigateToHome: () => void
	onNavigateToSettings: () => void
	onNavigateToGlobalEmotes: () => void
	onLogout: () => Promise<void>
}

export class HeaderController implements Controller {
	private readonly _logger: Logger = createAppLogger('HeaderController')
	private readonly _view: HeaderView
	private readonly _state: HeaderViewState

	constructor(private readonly _options: HeaderControllerOptions) {
		this._view = new HeaderView({
			onBackClick: () => this._options.onNavigateToHome(),
			onSettingsClick: () => this._options.onNavigateToSettings(),
			onGlobalsClick: () => this._options.onNavigateToGlobalEmotes(),
			onLogoutClick: () => void this._handleLogoutClick(),
		})

		this._state = {
			mode: 'identity',
			identity: null,
			isLoading: false,
			isMenuOpened: false,
		}
	}

	public mount(container: HTMLElement): void {
		this._view.render(this._state)
		this._view.mount(container)
	}

	public unmount(): void {
		this._view.unmount()
	}

	public setIdentity(identity: TwitchUser | null): void {
		this._state.identity = identity
		this._view.render(this._state)
	}

	public setMode(mode: HeaderMode): void {
		if (this._state.mode !== mode) {
			this._state.mode = mode
			this._view.render(this._state)
		}
	}

	private async _handleLogoutClick(): Promise<void> {
		this._state.isLoading = true
		this._view.render(this._state)

		try {
			await this._options.onLogout()
		}
		catch (err) {
			this._logger.error('Logout failed', err)
		}
		finally {
			this._state.isLoading = false
			this._view.render(this._state)
		}
	}
}
