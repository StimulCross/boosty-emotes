import { type RootContext } from '@content/contexts/root-context';
import { FavoriteEmotes } from '@shared/components/favorite-emotes';
import { Store } from '@shared/store';
import { type ScopesEmotesSets } from '@shared/types';
import { PageContext } from './page-context';

// TODO: Implement

export class MainPageContext extends PageContext {
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

	public getAvailableEmoteSetsByScope(): ScopesEmotesSets {
		return new Map();
	}

	public async getFavoriteEmotes(): Promise<FavoriteEmotes> {
		const globalFavoriteEmotes = await Store.getGlobalFavoriteEmotes();

		return new FavoriteEmotes(globalFavoriteEmotes);
	}
}
