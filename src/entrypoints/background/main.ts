import { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import { createAppLogger } from '@shared/utils'
import { AlarmsManager } from './alarms-manager.ts'
import { Authenticator } from './authenticator.ts'
import { EmoteApiClient } from './emotes-api-client'
import { EmotesSyncCoordinator } from './emotes-sync'
import { ExtensionUpdateHandler } from './extension-update-handler.ts'
import { FavoriteEmotes } from './favorite-emotes.ts'
import { TabsManager } from './tabs-manager.ts'

export async function main(): Promise<void> {
	const logger = createAppLogger('Background')
	logger.debug('Starting Service Worker...')

	const eventTarget = new EventTarget()
	const messageDispatcher = new MessageDispatcher()

	const messageReceiver = new MessageReceiver()
	messageReceiver.init()

	const favoriteEmotes = new FavoriteEmotes(messageReceiver, messageDispatcher)
	favoriteEmotes.init()

	const alarmsManager = new AlarmsManager()
	alarmsManager.init()

	const extensionUpdateHandler = new ExtensionUpdateHandler()
	extensionUpdateHandler.init()

	const authenticator = new Authenticator(eventTarget, alarmsManager, messageReceiver)
	await authenticator.start()

	const tabsManager = new TabsManager()
	tabsManager.init()

	const emotesApiClient = new EmoteApiClient()

	const syncCoordinator = new EmotesSyncCoordinator(
		eventTarget,
		alarmsManager,
		messageReceiver,
		tabsManager,
		emotesApiClient,
	)

	await syncCoordinator.start()

	logger.success('Service Worker Initialized')
}
