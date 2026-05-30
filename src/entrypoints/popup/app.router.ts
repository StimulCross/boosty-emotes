import type { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import type { HeaderMode } from './layouts/main-layout/components/header/header.view.ts'
import type { Controller } from './pages'
import { storage } from '@shared/storage'
import { TwitchApi } from '@shared/twitch-api'
import { createAppLogger } from '@shared/utils'
import { MainLayoutController } from './layouts'
import {
	AddUserController,
	AuthController,

	GlobalEmotesController,
	HomeController,
	SettingsController,
	UserProfileController,
} from './pages'

interface AppRouteConfig {
	isLayoutRequired?: boolean
	headerMode?: HeaderMode
	// eslint-disable-next-line ts/no-explicit-any
	getPage: (params?: any) => Controller
}

export interface AppRouterOptions {
	container: HTMLElement
	messageReceiver: MessageReceiver
	messageDispatcher: MessageDispatcher
}

export interface AppRouteParams {
	profile: { userId: string }
	[key: string]: Record<string, unknown> | undefined
}

export type AppRoute = 'auth' | 'home' | 'profile' | 'globalEmotes' | 'addUser' | 'settings'

export class AppRouter {
	private readonly _logger = createAppLogger('AppRouter')

	private readonly _mainLayout: MainLayoutController
	private _activePage: Controller | null = null
	private _currentRoute: AppRoute | null = null

	private readonly _routes: Record<AppRoute, AppRouteConfig> = {
		auth: {
			getPage: () =>
				new AuthController({
					onLogin: async () => await this._handleLogin(),
				}),
		},
		home: {
			isLayoutRequired: true,
			headerMode: 'identity',
			getPage: () =>
				new HomeController({
					onNavigateToProfile: (userId: string) => void this.navigate('profile', { userId }),
					onNavigateToAddUser: () => void this.navigate('addUser'),
				}),
		},
		addUser: {
			isLayoutRequired: true,
			headerMode: 'back',
			getPage: () =>
				new AddUserController({
					onAddUserSuccess: async (userId: string) => await this._handleAddUserSuccess(userId),
				}),
		},
		profile: {
			isLayoutRequired: true,
			headerMode: 'back',
			getPage: (params: AppRouteParams['profile']) =>
				new UserProfileController({
					userId: params.userId,
					messageReceiver: this._options.messageReceiver,
					messageDispatcher: this._options.messageDispatcher,
				}),
		},
		globalEmotes: {
			isLayoutRequired: true,
			headerMode: 'back',
			getPage: () =>
				new GlobalEmotesController({
					messageReceiver: this._options.messageReceiver,
					messageDispatcher: this._options.messageDispatcher,
				}),
		},
		settings: {
			isLayoutRequired: true,
			headerMode: 'back',
			getPage: () => new SettingsController(),
		},
	}

	constructor(private readonly _options: AppRouterOptions) {
		this._mainLayout = new MainLayoutController({
			onNavigateToHome: () => void this.navigate('home'),
			onNavigateToSettings: () => void this.navigate('settings'),
			onNavigateToGlobalEmotes: () => void this.navigate('globalEmotes'),
			onLogout: async () => await this._handleLogout(),
		})
	}

	public async init(): Promise<void> {
		const identity = await storage.auth.getIdentity()

		this._mainLayout.setIdentity(identity)

		await this.navigate(identity ? 'home' : 'auth')
	}

	public async navigate(route: AppRoute, params?: object): Promise<void> {
		if (this._currentRoute === route)
			return

		this._logger.debug(`Navigating to "${route}" with params:`, params ?? {})

		const routeConfig = this._routes[route]

		// eslint-disable-next-line ts/no-unnecessary-condition
		if (!routeConfig)
			throw new Error(`Unknown route: ${route}`)

		if (this._activePage) {
			this._activePage.unmount()
			this._activePage = null
		}

		if (routeConfig.isLayoutRequired) {
			if (this._currentRoute === 'auth' || !this._currentRoute)
				this._mainLayout.mount(this._options.container)

			if (routeConfig.headerMode)
				this._mainLayout.setHeaderMode(routeConfig.headerMode)
		}
		else {
			this._mainLayout.unmount()
		}

		const targetContainer = routeConfig.isLayoutRequired ? this._mainLayout.contentSlot : this._options.container

		this._activePage = routeConfig.getPage(params)
		this._activePage.mount(targetContainer)

		if (this._activePage.init)
			await this._activePage.init()

		this._currentRoute = route
	}

	private async _handleAddUserSuccess(userId: string): Promise<void> {
		this._options.messageDispatcher.broadcastEvent({ type: 'add_user', data: { userId } })
		await this.navigate('home')
	}

	private async _handleLogin(): Promise<void> {
		try {
			await this._options.messageDispatcher.sendCommand({ type: 'auth' })
		}
		catch (err) {
			this._logger.error('Failed to process authentication flow', err)

			return
		}

		const identity = await storage.auth.getIdentity()

		if (!identity) {
			this._logger.warn('Expected identity to be set after login but it is null')

			return
		}

		this._mainLayout.setIdentity(identity)

		await this.navigate('home')
	}

	private async _handleLogout(): Promise<void> {
		try {
			await TwitchApi.revokeAccessToken()
			this._options.messageDispatcher.broadcastEvent({ type: 'logout' })
		}
		catch (err) {
			this._logger.error('Failed to handle logout', err)
		}
		finally {
			await storage.auth.setIdentity(null)
			await storage.auth.setAccessToken(null)

			this._mainLayout.setIdentity(null)

			await this.navigate('auth')
		}
	}
}
