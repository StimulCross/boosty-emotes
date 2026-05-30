import type { Controller } from '@shared/ui'
import { AlertsController, UserListController } from './components'
import { HomeView } from './home.view.ts'

export interface HomeControllerOptions {
	onNavigateToProfile: (userId: string) => void
	onNavigateToAddUser: () => void
}

export class HomeController implements Controller {
	private readonly _view: HomeView
	private readonly _alertsController: AlertsController
	private readonly _userListController: UserListController
	private _isMounted = false

	constructor(private readonly _options: HomeControllerOptions) {
		this._view = new HomeView({
			onFabClick: () => this._options.onNavigateToAddUser(),
		})

		this._alertsController = new AlertsController({
			onEmpty: () => this._alertsController.unmount(),
		})

		this._userListController = new UserListController({
			onRequestUserInfo: userId => {
				this._options.onNavigateToProfile(userId)
			},
		})
	}

	public async init(): Promise<void> {
		await Promise.all([this._alertsController.init(), this._userListController.init()])
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._alertsController.mount(this._view.alertsSlot)
		this._userListController.mount(this._view.userListSlot)

		this._view.mount(container)
		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._alertsController.unmount()
		this._userListController.unmount()

		this._isMounted = false
	}
}
