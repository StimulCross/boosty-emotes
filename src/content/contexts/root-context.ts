import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { EventEmitter } from '@shared/event-emitter';
import { boostyEmotesMap, type Emote } from '@shared/models';
import { Store } from '@shared/store';
import { type EmoteProvider, type Message } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { ChannelPageContext } from './channel-page.context';
import { ChatOnlyPageContext } from './chat-only-page.context';
import { MainPageContext } from './main-page.context';
import { MessagesPageContext } from './messages-page.context';
import { type PageContext } from './page-context';
import { StreamPageContext } from './stream-page.context';

export class RootContext {
	private readonly _logger = createLogger(createLoggerOptions(RootContext.name));
	private _state: PageContext | null = null;
	public currentPath: string[];
	public currentUrl: URL = new URL(window.location.href);
	public $root: Element;
	public emitter = new EventEmitter();

	public readonly globalEmotes: Map<string, Emote> = new Map();
	public readonly globalEmotesByProvider: Map<EmoteProvider, Map<string, Emote>> = new Map([
		['boosty', boostyEmotesMap],
		['twitch', new Map<string, Emote>()],
		['7tv', new Map<string, Emote>()],
		['ffz', new Map<string, Emote>()],
		['bttv', new Map<string, Emote>()]
	]);

	constructor() {
		this.currentUrl = new URL(window.location.href);
		this.currentPath = this._convertPathToArr(this.currentUrl.pathname);

		const $root = document.querySelector('div#root');

		if (!$root) {
			throw new Error('No root element found');
		}

		this.$root = $root;
		this._initListeners();

		this._logger.debug('Initialized', this.$root);
	}

	public async init(): Promise<void> {
		await this._updateGlobalEmotes();
		await this._updateContext();
	}

	private _initListeners(): void {
		browser.runtime.onMessage.addListener(async (message: Message) => {
			try {
				if (message.type === 'global_emotes_update') {
					await this._updateGlobalEmotes();
				}
			} catch (e) {
				this._logger.error(e);
			}
		});

		browser.runtime.onMessage.addListener((message: Message) => {
			try {
				if (message.type === 'tab_url_change') {
					const url = new URL(message.data.url);
					const updated = this._handleUrlUpdate(url);

					if (updated) {
						this._logger.debug('Remote URL update', url);
					}
				}
			} catch (e) {
				this._logger.error(e);
			}
		});

		document.addEventListener(
			'click',
			() => {
				requestAnimationFrame(() => {
					const url = new URL(window.location.href);
					const updated = this._handleUrlUpdate(url);

					if (updated) {
						this._logger.debug('Local URL update', url);
					}
				});
			},
			true
		);
	}

	private async _updateGlobalEmotes(): Promise<void> {
		const globalEmotes = await Store.getGlobalEmotes();
		globalEmotes.forEach(globalEmote => {
			this.globalEmotes.set(globalEmote.name, globalEmote);
			this.globalEmotesByProvider.get(globalEmote.provider)?.set(globalEmote.id, globalEmote);
		});
	}

	private _handleUrlUpdate(url: URL): boolean {
		let updated = false;

		if (`${this.currentUrl.origin}${this.currentUrl.pathname}` !== `${url.origin}${url.pathname}`) {
			this.currentUrl = url;
			this.currentPath = this._convertPathToArr(url.pathname);
			this._updateContext().catch(e => this._logger.error(e));
			updated = true;
		}

		return updated;
	}

	private async _updateContext(): Promise<void> {
		await this._updateState();
		await this._state?.init();
	}

	private async _updateState(): Promise<void> {
		await this._state?.destroy();

		// Main page if no path
		if (this.currentPath.length === 0) {
			this._state = new MainPageContext(this);
		}
		// Skip all pages prefixed with `app/*` except for `app/messages`
		else if (this.currentPath[0] === 'app') {
			if (this.currentPath[1] === 'messages') {
				this._state = new MessagesPageContext(this);
			} else {
				this._state = null;
			}
		}
		// Check for posts and streams pages
		else if (this.currentPath[1]) {
			if (this.currentPath[1] === 'streams') {
				if (this.currentPath[2] === 'video_stream') {
					this._state = new StreamPageContext(this);
				} else if (this.currentPath[2] === 'only-chat') {
					this._state = new ChatOnlyPageContext(this);
				}
			} else if (this.currentPath[1] === 'posts' && this.currentPath[2]) {
				// The post page markup is similar to the channel page markup.
				this._state = new ChannelPageContext(this);
			}
		}
		// Check for channel main page
		else if (this.currentPath.length === 1) {
			this._state = new ChannelPageContext(this);
		}
		// All other pages should not be handled
		else {
			this._state = null;
		}
	}

	private _convertPathToArr(path: string): string[] {
		return path === '/' ? [] : path.slice(1).split('/');
	}
}
