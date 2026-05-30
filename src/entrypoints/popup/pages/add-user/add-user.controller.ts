import type { Controller } from '@shared/ui'
import { AddUserView } from './add-user.view.ts'
import { AddUserFormController } from './components'

export interface AddUserPageOptions {
	onAddUserSuccess: (userId: string) => Promise<void>
}

export class AddUserController implements Controller {
	private readonly _view = new AddUserView()
	private readonly _addUserFormController: AddUserFormController
	private _isMounted = false

	constructor(private readonly _options: AddUserPageOptions) {
		this._addUserFormController = new AddUserFormController({
			onSuccess: async (userId: string) => await this._options.onAddUserSuccess(userId),
		})
	}

	public async init(): Promise<void> {
		await this._addUserFormController.init()
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._addUserFormController.mount(this._view.formSlot)
		this._view.mount(container)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._addUserFormController.unmount()
		this._view.unmount()

		this._isMounted = false
	}
}
