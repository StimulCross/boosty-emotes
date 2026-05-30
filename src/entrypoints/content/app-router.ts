import type { EventMessageTabUrlChange, MessageDispatcher, MessageReceiver } from '@shared/messaging'
import type { GlobalEmoteService, GlobalFavoriteEmotesService } from '@shared/services'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import type {
	PageController,
	PageControllerOptions,
} from './controllers'
import type { BoostyApiClient, ChannelsService } from './services'
import { createAppLogger } from '@shared/utils'
import {
	ChannelPageController,
	ChatOnlyPageController,
	MainPageController,
	MessagesPageController,
	PostEditorPageController,
	StreamPageController,
} from './controllers'

type RouteType = 'main' | 'channel' | 'stream' | 'chat-only' | 'messages' | 'post' | 'new-post' | 'edit-post' | 'unknown'

interface RouteBase {
	type: RouteType
}

interface RouteMain extends RouteBase {
	type: Extract<RouteType, 'main'>
}

interface RouteChannel {
	type: Extract<RouteType, 'channel'>
	username: string
}

interface RouteStream {
	type: Extract<RouteType, 'stream'>
	username: string
}

interface ChatOnly {
	type: Extract<RouteType, 'chat-only'>
	username: string
}

interface RouteMessages {
	type: Extract<RouteType, 'messages'>
	dialogId: string
}

interface RoutePost {
	type: Extract<RouteType, 'post'>
	username: string
}

interface RouteNewPost {
	type: Extract<RouteType, 'new-post'>
	username: string
}

interface RouteEditPost {
	type: Extract<RouteType, 'edit-post'>
	username: string
	id: string
}

interface RouteUnknown {
	type: Extract<RouteType, 'unknown'>
}

type RouteMatch = RouteMain | RouteChannel | RouteStream | ChatOnly | RouteMessages | RoutePost | RouteNewPost | RouteEditPost | RouteUnknown

export interface AppRouterConfig {
	$root: HTMLElement
	ctx: ContentScriptContext
	messageReceiver: MessageReceiver
	messageDispatcher: MessageDispatcher
	globalEmotesService: GlobalEmoteService
	globalFavoriteEmotesService: GlobalFavoriteEmotesService
	channelsService: ChannelsService
	boostyApiClient: BoostyApiClient
}

export class AppRouter {
	private readonly _logger = createAppLogger('AppRouter')
	private _activeController: PageController | null = null
	private _currentUrl: URL = new URL(globalThis.location.href)

	constructor(private readonly _config: AppRouterConfig) {}

	public async init(): Promise<void> {
		this._initListeners()
		await this._updateRoute()
		this._logger.debug('Initialized')
	}

	private _matchRoute(url: URL): RouteMatch {
		const path = this._parsePath(url.pathname)

		// /
		if (path.length === 0)
			return { type: 'main' }

		// /app/*
		if (path[0] === 'app') {
			// /app/messages?dialogId=...
			if (path[1] === 'messages') {
				const dialogId = url.searchParams.get('dialogId')

				if (dialogId)
					return { type: 'messages', dialogId }
			}

			return { type: 'unknown' }
		}

		// /:username/streams/video_stream
		if (path[1] === 'streams' && path[2] === 'video_stream')
			return { type: 'stream', username: path[0].toLowerCase() }

		// /:username/streams/only-chat
		if (path[1] === 'streams' && path[2] === 'only-chat')
			return { type: 'chat-only', username: path[0].toLowerCase() }

		// /:username/posts/:postId (layout identical to channel page)
		if (path[1] === 'posts' && path[2])
			return { type: 'post', username: path[0].toLowerCase() }

		if (path[1] === 'new-post')
			return { type: 'new-post', username: path[0].toLowerCase() }

		if (path[1] === 'edit-post')
			return { type: 'edit-post', username: path[0].toLowerCase(), id: path[2] }

		// /:username
		if (path.length === 1)
			return { type: 'channel', username: path[0].toLowerCase() }

		return { type: 'unknown' }
	}

	private async _updateRoute(): Promise<void> {
		if (this._activeController) {
			await this._activeController.destroy()
			this._activeController = null
		}

		const route = this._matchRoute(this._currentUrl)

		this._logger.verbose('Matched route', route)

		const base: PageControllerOptions = {
			$root: this._config.$root,
			globalEmoteService: this._config.globalEmotesService,
			globalFavoriteEmoteService: this._config.globalFavoriteEmotesService,
		}

		switch (route.type) {
			case 'main':
				this._activeController = new MainPageController({
					...base,
					channelsService: this._config.channelsService,
					boostyApiClient: this._config.boostyApiClient,
				})

				break

			case 'channel':
			case 'post':
				this._activeController = new ChannelPageController({
					...base,
					messageReceiver: this._config.messageReceiver,
					channelsService: this._config.channelsService,
					boostyApiClient: this._config.boostyApiClient,
					username: route.username,
				})

				break

			case 'stream':
				this._activeController = new StreamPageController({
					...base,
					messageReceiver: this._config.messageReceiver,
					channelsService: this._config.channelsService,
					boostyApiClient: this._config.boostyApiClient,
					username: route.username,
				})

				break

			case 'chat-only':
				this._activeController = new ChatOnlyPageController({
					...base,
					messageReceiver: this._config.messageReceiver,
					channelsService: this._config.channelsService,
					boostyApiClient: this._config.boostyApiClient,
					username: route.username,
				})

				break

			case 'messages':
				this._activeController = new MessagesPageController({
					...base,
					messageReceiver: this._config.messageReceiver,
					channelsService: this._config.channelsService,
					dialogId: route.dialogId,
					boostyApiClient: this._config.boostyApiClient,
				})

				break

			case 'edit-post':
			case 'new-post':
				this._activeController = new PostEditorPageController({
					...base,
					messageReceiver: this._config.messageReceiver,
					channelsService: this._config.channelsService,
					boostyApiClient: this._config.boostyApiClient,
					username: route.username,
				})

				break

			default:
				break
		}

		if (this._activeController) {
			await this._activeController.init()
		}
	}

	private _shouldUpdate(next: URL): boolean {
		const cur = this._currentUrl

		const pathnameChanged = cur.pathname !== next.pathname

		if (pathnameChanged)
			return true

		// /app/messages dialogId should be treated as a route change
		if (next.pathname === '/app/messages')
			return cur.searchParams.get('dialogId') !== next.searchParams.get('dialogId')

		return false
	}

	private _handleUrlUpdate(url: URL, source: 'local' | 'remote'): void {
		this._logger.verbose('Handling URL update', url.href)

		if (!this._shouldUpdate(url))
			return

		this._logger.debug(`Route changed -> ${url.pathname} | Source: "${source}"`)

		this._currentUrl = url
		this._updateRoute().catch(err => this._logger.error('Route update failed', err))
	}

	private _initListeners(): void {
		this._config.messageReceiver.registerEvent('tab_url_change', (message: EventMessageTabUrlChange) => {
			try {
				this._handleUrlUpdate(new URL(message.data.url), 'remote')
			}
			catch (err) {
				this._logger.error('Failed to handle remote URL update', err)
			}
		})

		this._config.ctx.addEventListener(globalThis, 'wxt:locationchange', evt => {
			this._handleUrlUpdate(
				// @ts-expect-error Types...
				// eslint-disable-next-line ts/no-unsafe-argument
				evt.newUrl,
				'local',
			)
		})
	}

	private _parsePath(pathname: string): string[] {
		return pathname === '/' ? [] : pathname.slice(1).split('/')
	}
}
