import type { TwitchUser } from '@shared/models'
import type { Controller } from '@shared/ui'
import type { HeaderMode } from './components/header/header.view.ts'
import { FooterController, HeaderController } from './components'
import { MainLayoutView } from './main-layout.view.ts'

export interface MainLayoutControllerOptions {
	onNavigateToHome: () => void
	onNavigateToSettings: () => void
	onNavigateToGlobalEmotes: () => void
	onLogout: () => Promise<void>
}

export class MainLayoutController implements Controller {
	private readonly _view = new MainLayoutView()

	private readonly _headerController: HeaderController
	private readonly _footerController: FooterController

	private _isMounted = false

	constructor(private readonly _options: MainLayoutControllerOptions) {
		this._headerController = new HeaderController({
			onNavigateToHome: () => this._options.onNavigateToHome(),
			onNavigateToSettings: () => this._options.onNavigateToSettings(),
			onNavigateToGlobalEmotes: () => this._options.onNavigateToGlobalEmotes(),
			onLogout: async () => await this._options.onLogout(),
		})

		this._footerController = new FooterController()
	}

	public get contentSlot(): HTMLElement {
		return this._view.contentSlot
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._view.mount(container)

		this._headerController.mount(this._view.headerSlot)
		this._footerController.mount(this._view.footerSlot)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._headerController.unmount()
		this._footerController.unmount()
		this._view.unmount()

		this._isMounted = false
	}

	public setIdentity(identity: TwitchUser | null): void {
		this._headerController.setIdentity(identity)
	}

	public setHeaderMode(mode: HeaderMode): void {
		this._headerController.setMode(mode)
	}
}
