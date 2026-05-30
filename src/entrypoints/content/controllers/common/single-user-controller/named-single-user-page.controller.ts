import type { SingleUserPageControllerOptions } from './single-user-page.controller.ts'
import { storage } from '@shared/storage'
import { BOOSTY_PROFILE_UPDATE_INTERVAL_MS } from '../../../constants.ts'
import { SingleUserPageController } from './single-user-page.controller.ts'

export interface NamedSingleUserPageControllerOptions extends SingleUserPageControllerOptions {
	username: string
}

export abstract class NamedSingleUserPageController<
	O extends NamedSingleUserPageControllerOptions = NamedSingleUserPageControllerOptions,
> extends SingleUserPageController<O> {
	protected override async _checkBoostyProfile(): Promise<void> {
		const username = this._options.username

		const ignoredUser = await storage.ignoredUsers.getIgnoredUserByName(username)

		if (ignoredUser)
			return

		const user = await storage.users.getByBoostyName(username)

		if (!user) {
			const boostyUser = await this._boostyApiClient.getUser(username)

			if (!boostyUser) {
				this._logger.warn('Could not fetch Boosty user', username)

				return
			}

			await storage.ignoredUsers.addIgnoredUser({
				id: boostyUser.owner.id,
				name: boostyUser.blogUrl,
				displayName: boostyUser.owner.name,
			})

			return
		}

		const { boostyProfile, twitchProfile, state } = user

		const authorDisplayName = this._extractAuthorDisplayName()
		let shouldUpdateFromApi = false

		if (authorDisplayName && authorDisplayName !== boostyProfile.displayName) {
			if (boostyProfile.id) {
				this._logger.debug(`Display name of @${user.twitchProfile.displayName} changed. Updating locally...`, user)
				await storage.users.setBoostyProfileData(twitchProfile.id, { id: boostyProfile.id, displayName: authorDisplayName })

				return
			}
			else {
				shouldUpdateFromApi = true
			}
		}

		if (!boostyProfile.id || !boostyProfile.displayName)
			shouldUpdateFromApi = true

		if (Date.now() > state.boostyProfileUpdatedAt + BOOSTY_PROFILE_UPDATE_INTERVAL_MS)
			shouldUpdateFromApi = true

		if (shouldUpdateFromApi) {
			this._logger.debug('Fetching Boosty profile data...', user)

			const boostyUser = await this._boostyApiClient.getUser(username)

			if (!boostyUser)
				return

			const promises: Promise<void>[] = [
				storage.users.setBoostyProfileData(twitchProfile.id, {
					id: boostyUser.owner.id,
					displayName: boostyUser.owner.name,
				}),
				storage.ignoredUsers.removeIgnoredUserByName(username),
			]

			await Promise.all(promises)

			this._logger.info('Boosty profile was updated', user)
		}
	}

	protected _extractAuthorDisplayName(): string | null {
		return null
	}
}
