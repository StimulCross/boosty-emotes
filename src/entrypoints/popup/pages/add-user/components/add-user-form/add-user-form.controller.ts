import type { BoostyUser } from '@shared/models'
import type { Controller } from '@shared/ui'
import { BOOSTY_USERNAME_REGEX } from '@shared/constants.ts'
import { BoostyUserAlreadyExistsError, TwitchUserAlreadyExistsError } from '@shared/errors'
import { storage } from '@shared/storage'
import { TwitchApi } from '@shared/twitch-api'
import { createAppLogger } from '@shared/utils'
import { AddUserFormView } from './add-user-form.view.ts'

export interface AddUserFormControllerOptions {
	onSuccess: (userId: string) => Promise<void>
}

export class AddUserFormController implements Controller {
	private readonly _logger = createAppLogger('AddUserFormController')

	private readonly _view = new AddUserFormView({
		onSubmit: async (twitchUsername, boostyUsername) => await this._handleSubmit(twitchUsername, boostyUsername),
	})

	private _isMounted = false

	constructor(private readonly _options: AddUserFormControllerOptions) {}

	public async init(): Promise<void> {
		try {
			const tabs = await browser.tabs.query({ active: true, currentWindow: true })

			if (tabs.length > 0) {
				const url = tabs[0]?.url

				if (url) {
					const matches = BOOSTY_USERNAME_REGEX.exec(url)

					if (matches?.groups?.username)
						this._view.setBoostyUsername(matches.groups.username)
				}
			}
		}
		catch (err) {
			this._logger.warn('Could not parse boosty username from tab', err)
		}
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._view.render({ error: null, isLoading: false })
		this._view.mount(container)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._isMounted = false
	}

	private async _handleSubmit(twitchUsername: string, boostyUsername: string): Promise<void> {
		if (!twitchUsername || !boostyUsername) {
			this._view.render({
				error: browser.i18n.getMessage('add_user_empty_inputs_error'),
				isLoading: false,
			})

			return
		}

		this._view.render({ error: null, isLoading: true })

		try {
			const twitchUser = await TwitchApi.getUserByName(twitchUsername)

			if (!twitchUser) {
				this._view.render({
					error: browser.i18n.getMessage('add_user_user_does_not_exist', [twitchUsername]),
					isLoading: false,
				})

				return
			}

			const boostyUser: BoostyUser = { name: boostyUsername.toLowerCase() }
			const ignoredUser = await storage.ignoredUsers.getIgnoredUserByName(boostyUser.name)

			if (ignoredUser) {
				boostyUser.id = ignoredUser.id
				boostyUser.displayName = ignoredUser.displayName
			}

			const promises: Promise<void>[] = [
				storage.users.add(twitchUser, boostyUser),
				storage.ignoredUsers.removeIgnoredUserByName(boostyUser.name),
			]

			await Promise.all(promises)
			await this._options.onSuccess(twitchUser.id)
		}
		catch (err) {
			let errorMsg = browser.i18n.getMessage('add_user_unknown_error')

			if (err instanceof BoostyUserAlreadyExistsError) {
				errorMsg = browser.i18n.getMessage('add_user_boosty_user_already_exists', [
					err.boostyUsername,
					err.twitchUsername,
				])
			}
			else if (err instanceof TwitchUserAlreadyExistsError) {
				errorMsg = browser.i18n.getMessage('add_user_twitch_user_already_exists', [
					err.boostyUsername,
					err.twitchUsername,
				])
			}
			else {
				this._logger.error(err)
			}

			this._view.render({ error: errorMsg, isLoading: false })
		}
	}
}
