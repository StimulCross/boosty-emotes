import type { User } from '@shared/models'
import { UserProfileHeaderView } from './user-profile-header.view.ts'

export class UserProfileHeaderController {
	private readonly _view: UserProfileHeaderView
	private _isMounted = false

	constructor() {
		this._view = new UserProfileHeaderView()
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._view.mount(container)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._isMounted = false
	}

	public setUser(user: User): void {
		this._view.render(user)
	}
}
