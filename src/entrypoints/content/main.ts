import type { ContentScriptContext } from 'wxt/utils/content-script-context'
import { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import { GlobalEmoteService, GlobalFavoriteEmotesService } from '@shared/services'
import { createAppLogger } from '@shared/utils'
import { LoggerRuntime } from '@stimulcross/logger'
import { Formatter } from '../popup/shared/utils/formatter.ts'
import { AppRouter } from './app-router.ts'
import { BoostyApiClient, ChannelsService } from './services'
import './styles/index.css'

export function main(ctx: ContentScriptContext): void {
	// @ts-expect-error Extension API
	globalThis.BOOSTY_EMOTES_EXTENSION_API = {
		loggerRuntime: LoggerRuntime,
	}

	const logger = createAppLogger('Content')
	logger.debug('Starting...', document.querySelector('div#root'))

	const messageReceiver = new MessageReceiver()
	const messageDispatcher = new MessageDispatcher()
	const boostyApiClient = new BoostyApiClient()
	const globalEmotesService = new GlobalEmoteService(messageReceiver)
	const globalFavoriteEmotesService = new GlobalFavoriteEmotesService(messageReceiver, messageDispatcher)
	const channelsService = new ChannelsService(messageReceiver, messageDispatcher)

	const startApp = async (): Promise<void> => {
		try {
			const $root = document.querySelector<HTMLElement>('div#root')

			if (!$root)
				throw new Error('Root element not found')

			messageReceiver.init()

			await Promise.all([Formatter.init(), globalEmotesService.init(), globalFavoriteEmotesService.init()])

			const app = new AppRouter({
				$root,
				ctx,
				messageReceiver,
				messageDispatcher,
				globalEmotesService,
				globalFavoriteEmotesService,
				channelsService,
				boostyApiClient,
			})

			await app.init()

			logger.success('Content script initialized')
		}
		catch (err) {
			logger.fatal('Failed to initialize content script', err)
		}
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', () => void startApp())
	else
		void startApp()
}
