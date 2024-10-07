import browser from 'webextension-polyfill';
import { EmotePickerComponent, type EmotePickerStyleOptions, RedactorsState } from '@content/components';
import { getCaretPosition } from '@content/utils';
import { EmoteTooltip } from '@shared/components/emote-tooltip';
import type { Emote, User } from '@shared/models';
import { Store } from '@shared/store';
import type { EmotesSet, Message, ProviderEmotesSets, ScopesEmotesSets } from '@shared/types';
import { PageContext } from './page-context';
import type { RootContext } from './root-context';

export abstract class SingleUserContext extends PageContext {
	protected _user: User | null = null;
	protected _channelEmotes: EmotesSet = new Map();
	protected readonly _channelEmotesByProvider: ProviderEmotesSets = new Map([
		['twitch', new Map<string, Emote>()],
		['7tv', new Map<string, Emote>()],
		['ffz', new Map<string, Emote>()],
		['bttv', new Map<string, Emote>()]
	]);
	private readonly _observer: MutationObserver;
	private readonly _tooltip: EmoteTooltip;
	protected readonly _emotePickerComponent: EmotePickerComponent;
	private readonly _redactorsState = new RedactorsState();

	protected constructor(
		rootContext: RootContext,
		publisherRootClassNames: string[],
		emotePickerStyleOptions?: EmotePickerStyleOptions
	) {
		const $root = document.querySelector('div#root');

		if (!($root instanceof HTMLElement)) {
			throw new Error('No root element found');
		}

		super(rootContext, $root, rootContext.emitter, ['click', 'input', 'keyup']);

		this._tooltip = new EmoteTooltip(this.$root);
		this._emotePickerComponent = new EmotePickerComponent(
			this.$root,
			publisherRootClassNames,
			this._rootContext.emitter,
			this._redactorsState,
			emotePickerStyleOptions
		);

		this._observer = this._createMutationObserver();
		this._observer.observe(this.$root, { childList: true, subtree: true });

		this._handleBackgroundMessage = this._handleBackgroundMessage.bind(this);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		browser.runtime.onMessage.addListener(this._handleBackgroundMessage);

		this.initDomListeners();
	}

	public abstract init(): Promise<void>;

	public override async destroy(): Promise<void> {
		await super.destroy();

		this._observer.disconnect();
		this._tooltip.destroy();
		this._emotePickerComponent.hide();

		// eslint-disable-next-line @typescript-eslint/unbound-method
		browser.runtime.onMessage.removeListener(this._handleBackgroundMessage);
	}

	protected abstract _createMutationObserver(): MutationObserver;

	protected async _resolveUser(): Promise<User | null> {
		const username = this._rootContext.currentPath[0];

		if (username) {
			const user = await Store.getUserByBoostyName(username);

			if (user) {
				return user;
			}
		}

		return null;
	}

	protected async _initUser(): Promise<void> {
		const user = await this._resolveUser();

		if (user) {
			this._user = user;
			await this._updateChannelEmotes(user.twitchProfile.id);
		}
	}

	protected _updateRedactorCaretPosition(element: Element): void {
		const redactor = element.closest('.codex-editor__redactor');

		if (!(redactor instanceof HTMLElement)) {
			return;
		}

		const caretPosition = getCaretPosition(element);
		this._redactorsState.set(redactor, caretPosition);
	}

	private async _updateChannelEmotes(userId: string): Promise<void> {
		const channelEmotes = await Store.getChannelEmotes(userId);

		this._channelEmotes = new Map();
		this._channelEmotesByProvider.set('twitch', new Map());
		this._channelEmotesByProvider.set('7tv', new Map());
		this._channelEmotesByProvider.set('ffz', new Map());
		this._channelEmotesByProvider.set('bttv', new Map());

		channelEmotes.forEach(emote => {
			this._channelEmotes.set(emote.name, emote);
			this._channelEmotesByProvider.get(emote.provider)?.set(emote.name, emote);
		});
	}

	private async _handleBackgroundMessage(message: Message): Promise<void> {
		try {
			if (message.type === 'channel_emotes_update') {
				if (message.data.userId === this._user?.twitchProfile.id) {
					await this._updateChannelEmotes(message.data.userId);
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onInput(evt: InputEvent): void {
		try {
			if (evt.target instanceof HTMLElement && evt.target.classList.contains('cdx-block')) {
				this._updateRedactorCaretPosition(evt.target);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onKeyup(evt: KeyboardEvent): void {
		try {
			if (evt.target instanceof HTMLElement && evt.target.classList.contains('cdx-block')) {
				this._updateRedactorCaretPosition(evt.target);
			} else if (evt.key === 'Escape' && this._emotePickerComponent.isShown) {
				this._emotePickerComponent.hide();
			}
		} catch (e) {
			this._logger.error(e);
		}
	}
}
