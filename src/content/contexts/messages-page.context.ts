import type { RootContext } from '@content/contexts/root-context';
import { PageContext } from './page-context';

// TODO: Implement

export class MessagesPageContext extends PageContext {
	constructor(rootContext: RootContext) {
		const $root = document.querySelector('div#root');

		if (!($root instanceof HTMLElement)) {
			throw new Error('No root element found');
		}

		super(rootContext, $root, rootContext.emitter);
	}

	public async init(): Promise<void> {
		return await Promise.resolve();
	}
}
