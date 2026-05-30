import type { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import { ChannelEmoteService, ChannelFavoriteEmotesService } from '@shared/services'

export class ChannelContext {
	private readonly _emoteService: ChannelEmoteService
	private readonly _favoriteEmotesService: ChannelFavoriteEmotesService

	private _isInitialized = false

	constructor(
		private readonly _userId: string,
		messageReceiver: MessageReceiver,
		messageDispatcher: MessageDispatcher,
	) {
		this._emoteService = new ChannelEmoteService(_userId, messageReceiver)
		this._favoriteEmotesService = new ChannelFavoriteEmotesService(_userId, messageReceiver, messageDispatcher)
	}

	public get userId(): string {
		return this._userId
	}

	public get emoteService(): ChannelEmoteService {
		return this._emoteService
	}

	public get favoriteEmotesService(): ChannelFavoriteEmotesService {
		return this._favoriteEmotesService
	}

	public async init(): Promise<void> {
		if (this._isInitialized)
			return

		await Promise.all([this._emoteService.init(), this._favoriteEmotesService.init()])

		this._isInitialized = true
	}

	public destroy(): void {
		this._emoteService.destroy()
		this._favoriteEmotesService.destroy()
		this._isInitialized = false
	}
}
