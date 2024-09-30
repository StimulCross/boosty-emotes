import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmotesUpdater } from './emotes-updater';
import { TabsObserver } from './tabs-observer';

const keepAlive = (): unknown => setInterval(() => void browser.runtime.getPlatformInfo(), 20_000);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

async function main(): Promise<void> {
	const logger = createLogger(createLoggerOptions('Background'));
	logger.debug('Starting...');

	const tabsManager = new TabsObserver();
	tabsManager.initListeners();

	const emotesUpdater = new EmotesUpdater();
	await emotesUpdater.init();
	await emotesUpdater.start();

	logger.success('Started');
}

void main();
