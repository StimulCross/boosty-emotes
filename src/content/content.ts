// eslint-disable-next-line import/no-unassigned-import
import './scss/index.scss';
import { createLogger } from '@stimulcross/logger';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { RootContext } from './contexts';

async function main(): Promise<void> {
	const logger = createLogger(createLoggerOptions('Content'));
	logger.debug('Starting...', document.querySelector('div#root'));

	const context = new RootContext();
	await context.init();

	logger.success('Started');
}

void main();
