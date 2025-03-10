import { createLogger, type Logger } from '@stimulcross/logger';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { type ScopesEmotesSets } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { type RootContext } from './root-context';

export abstract class PageContext extends DomListener {
	protected readonly _logger: Logger;

	protected constructor(
		protected readonly _rootContext: RootContext,
		$root: HTMLElement,
		emitter: EventEmitter,
		listeners?: string[]
	) {
		super($root, { emitter, listeners });
		this._logger = createLogger(createLoggerOptions(this.constructor.name));
		this._logger.debug('Created');
	}

	public async init(): Promise<void> {
		return await Promise.resolve();
	}

	public async destroy(): Promise<void> {
		this.removeDomListeners();
		return await Promise.resolve();
	}

	public abstract getAvailableEmoteSetsByScope(): ScopesEmotesSets;
	public abstract getFavoriteEmotes(): Promise<FavoriteEmotes>;
}
