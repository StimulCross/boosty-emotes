import type { Controller } from '@shared/ui'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { UserListView } from './user-list.view.ts'

export interface UserListControllerOptions {
	onRequestUserInfo: (userId: string) => void
}

export class UserListController implements Controller {
	private readonly _logger = createAppLogger('UserListController')
	private readonly _view: UserListView
	private _isMounted = false

	constructor(private readonly _options: UserListControllerOptions) {
		this._view = new UserListView({
			onUserCardClick: (userId: string) => this._options.onRequestUserInfo(userId),
			onUserRemoved: (userId: string) => void this.onUserRemoved(userId),
		})
	}

	public async init(): Promise<void> {
		await this.refresh()
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

	public async refresh(): Promise<void> {
		const users = await storage.users.getAll()

		this._view.render({ users })
	}

	private async onUserRemoved(userId: string): Promise<void> {
		this._view.removeUserCard(userId)

		const user = await storage.users.getByTwitchId(userId)

		try {
			const promises: Promise<void>[] = [
				storage.users.remove(userId),
				storage.emotes.clearChannelEmotes(userId),
				storage.favoriteEmotes.clearChannelFavorites(userId),
			]

			const boostyProfile = user?.boostyProfile

			if (boostyProfile?.id && boostyProfile.displayName) {
				promises.push(storage.ignoredUsers.addIgnoredUser({
					id: boostyProfile.id,
					name: boostyProfile.name,
					displayName: boostyProfile.displayName,
				}))
			}

			await Promise.all(promises)
		}
		catch (err) {
			this._logger.error(`Failed to remove user ${userId}`, err)
			await this.refresh()
		}
	}
}
