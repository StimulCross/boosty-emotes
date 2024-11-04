import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { Authenticator } from '@/background/authenticator';
import { EventEmitter } from '@shared/event-emitter';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmotesUpdater } from './emotes-updater';
import { TabsObserver } from './tabs-observer';

const keepAlive = (): unknown => setInterval(() => void browser.runtime.getPlatformInfo(), 20_000);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

async function main(): Promise<void> {
	const logger = createLogger(createLoggerOptions('Background'));
	logger.debug('Starting...');

	const emitter = new EventEmitter();

	const authenticator = new Authenticator(emitter);
	authenticator.initListeners();

	const tabsManager = new TabsObserver();
	tabsManager.initListeners();

	const emotesUpdater = new EmotesUpdater(emitter);
	await emotesUpdater.init();
	await emotesUpdater.start();

	logger.success('Started');
}

void main();
