import type { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import { createAppLogger } from '@shared/utils'
import { ChannelContext } from './channel-context.ts'

export class ChannelsService {
	private readonly _logger = createAppLogger('ChannelsService')
	private readonly _cache = new Map<string, ChannelContext>()
	private readonly _aliases = new Map<string, string>()

	constructor(
		private readonly _messageReceiver: MessageReceiver,
		private readonly _messageDispatcher: MessageDispatcher,
	) {}

	public async getOrCreate(userId: string): Promise<ChannelContext> {
		const cached = this._cache.get(userId)

		if (cached)
			return cached

		const context = new ChannelContext(userId, this._messageReceiver, this._messageDispatcher)
		await context.init()

		this._cache.set(userId, context)
		this._logger.debug(`Created channel context for user ${userId}`)

		return context
	}

	public async getOrCreateByAlias(alias: string): Promise<ChannelContext | null> {
		const userId = this._aliases.get(alias)

		if (userId)
			return await this.getOrCreate(userId)

		return null
	}

	public addAlias(alias: string, userId: string): void {
		const existing = this._aliases.get(alias)

		if (existing && existing !== userId)
			this._logger.warn(`Alias "${alias}" already points to "${existing}", overwriting with "${userId}"`)

		this._aliases.set(alias, userId)
		this._logger.debug(`Added alias "${alias}" → "${userId}"`)
	}

	public removeAlias(alias: string): void {
		if (this._aliases.delete(alias))
			this._logger.debug(`Removed alias "${alias}"`)
	}

	public removeAliasesForUser(userId: string): void {
		for (const [alias, uid] of this._aliases) {
			if (uid === userId) {
				this._aliases.delete(alias)
				this._logger.debug(`Removed alias "${alias}" (user ${userId})`)
			}
		}
	}

	public destroy(userId: string): void {
		const context = this._cache.get(userId)

		if (!context)
			return

		context.destroy()

		this._cache.delete(userId)
		this.removeAliasesForUser(userId)

		this._logger.debug(`Destroyed channel context for user ${userId}`)
	}

	public destroyAll(): void {
		for (const [userId, context] of this._cache) {
			context.destroy()
			this._logger.debug(`Destroyed channel context for user ${userId}`)
		}

		this._cache.clear()
	}
}
