import type { EventMessageAddUser, MessageReceiver } from '@shared/messaging'
import type { User } from '@shared/models'
import type { AlarmsManager } from '../alarms-manager.ts'
import type { EmoteApiClient } from '../emotes-api-client'
import type { TabsManager } from '../tabs-manager.ts'
import { storage } from '@shared/storage/storage.ts'
import { TwitchApi } from '@shared/twitch-api'
import { createAppLogger } from '@shared/utils'
import { LOGIN_EVENT } from '../events/login.event.ts'
import { ChannelEmotesSyncService } from './channel-emotes-sync.service.ts'
import { GlobalEmotesSyncService } from './global-emotes-sync.service.ts'

const ALARM_UPDATE_EMOTES = 'update_emotes'
const ALARM_UPDATE_EMOTES_INTERVAL_IN_MINUTES = 10

export class EmotesSyncCoordinator {
	private readonly _logger = createAppLogger('EmotesSyncCoordinator')

	private readonly _globalService: GlobalEmotesSyncService
	private readonly _channelService: ChannelEmotesSyncService

	constructor(
		private readonly _eventTarget: EventTarget,
		private readonly _alarmsManager: AlarmsManager,
		private readonly _messageReceiver: MessageReceiver,
		private readonly _tabsManager: TabsManager,
		emotesApiClient: EmoteApiClient,
	) {
		this._globalService = new GlobalEmotesSyncService(
			emotesApiClient,
			ALARM_UPDATE_EMOTES_INTERVAL_IN_MINUTES * 60 * 1000,
		)

		this._channelService = new ChannelEmotesSyncService(
			emotesApiClient,
			ALARM_UPDATE_EMOTES_INTERVAL_IN_MINUTES * 60 * 1000,
		)

		this._setup()
	}

	public async start(): Promise<void> {
		await this._alarmsManager.registerAlarm(
			ALARM_UPDATE_EMOTES,
			ALARM_UPDATE_EMOTES_INTERVAL_IN_MINUTES,
			async () => {
				try {
					await Promise.all([this._handleGlobalEmotesUpdate(), this._handleUsersUpdate()])
				}
				catch (err) {
					this._logger.error('Failed to update global emotes', err)
				}
			},
		)

		const identity = await storage.auth.getIdentity()

		if (!identity) {
			this._logger.warn('No user identity found. Sync coordinator is idle.')

			return
		}

		this._logger.debug('Starting sync coordinator...')

		await Promise.all([this._handleGlobalEmotesUpdate(), this._handleUsersUpdate()])

		this._logger.success('Sync coordinator started')
	}

	public async stop(): Promise<void> {
		await this._alarmsManager.clearAlarm(ALARM_UPDATE_EMOTES)
		this._logger.success('Sync coordinator stopped')
	}

	private _setup(): void {
		this._eventTarget.addEventListener(LOGIN_EVENT, () => {
			void this._handleLogin()
		})

		this._messageReceiver.registerEvent('add_user', async (message: EventMessageAddUser) => {
			const user = await storage.users.getByTwitchId(message.data.userId)

			if (user)
				await this._updateUserAndNotify(user)
		})

		this._messageReceiver.registerEvent('logout', async () => {
			this._logger.info('Logout event received, stopping coordinator...')

			try {
				await this.stop()
			}
			catch (err) {
				this._logger.error('Failed to stop coordinator on logout', err)
			}
		})
	}

	private async _handleLogin(): Promise<void> {
		try {
			this._logger.info('Login event received, initializing coordinator...')
			await this.start()
		}
		catch (err) {
			this._logger.error('Failed to start coordinator on login', err)
		}
	}

	private async _handleGlobalEmotesUpdate(): Promise<void> {
		const result = await this._globalService.updateAll()

		if (result) {
			await this._tabsManager.notifyTabs({
				type: 'global_emotes_update',
				data: { added: result.added, removed: result.removed },
			})
		}
	}

	private async _handleUsersUpdate(): Promise<void> {
		const users = await storage.users.getAll()

		for (const user of users)
			await this._updateUserAndNotify(user)
	}

	private async _updateUserProfile(localUser: User): Promise<User> {
		const twitchUser = await TwitchApi.getUserById(localUser.twitchProfile.id)

		const updatedUser: User = {
			...localUser,
			twitchProfile: twitchUser ?? localUser.twitchProfile,
			state: {
				...localUser.state,
				active: Boolean(twitchUser),
				updatedAt: Date.now(),
			},
		}

		await storage.users.updateTwitchData(localUser.twitchProfile.id, updatedUser.twitchProfile, updatedUser.state)

		return updatedUser
	}

	private async _updateUserAndNotify(user: User): Promise<void> {
		let actualUser = user

		try {
			actualUser = await this._updateUserProfile(user)
		}
		catch (err) {
			this._logger.error(
				`Failed to update user profile for user @${actualUser.twitchProfile.displayName} (${actualUser.twitchProfile.id})`,
				err,
			)
		}

		const result = await this._channelService.updateForUser(actualUser)

		if (result) {
			await this._tabsManager.notifyTabs({
				type: 'channel_emotes_update',
				data: { userId: actualUser.twitchProfile.id, added: result.added, removed: result.removed },
			})
		}
	}
}
