// eslint-disable-next-line import/no-unassigned-import
import './scss/index.scss';

import { createLogger } from '@stimulcross/logger';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { App } from './app';
import {
	AddUserModalComponent,
	BodyComponent,
	FooterComponent,
	GlobalEmotesComponent,
	HeaderComponent,
	LoginComponent,
	UserInfoComponent
} from './components';

async function main(): Promise<void> {
	const logger = createLogger(createLoggerOptions('Popup'));
	logger.debug('Starting...');

	const app = new App([
		LoginComponent,
		HeaderComponent,
		BodyComponent,
		GlobalEmotesComponent,
		UserInfoComponent,
		AddUserModalComponent,
		FooterComponent
	]);
	const $root = await app.getRoot();
	document.body.append($root);

	logger.success('Started');
}

void main();
