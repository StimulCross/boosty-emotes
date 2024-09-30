import { createEmotePickerButton } from '@content/templates';
import { replaceEmotesInNode } from '@content/utils';
import type { RootContext } from './root-context';
import { SingleUserContext } from './single-user.context';

export class ChatOnlyPageContext extends SingleUserContext {
	constructor(rootContext: RootContext) {
		super(rootContext, ['ChatPublisher_root_'], { bottomOffset: -10, zIndex: 9 });
	}

	public async init(): Promise<void> {
		const user = await this._resolveUser();

		if (user) {
			this._user = user;
			await this._updateChannelEmotes(user.twitchProfile.id);
		}

		const emotePickerBtn = this.$root.querySelector('[class*=SmileButton_root_]');

		if (emotePickerBtn) {
			emotePickerBtn.replaceWith(createEmotePickerButton());
		}

		const messages = this.$root.querySelectorAll('[class*=ChatMessage_text_]');

		for (const message of messages) {
			this._replaceEmotesInChatMessage(message);
		}

		this._logger.debug('Initialized', this._user);
	}

	protected _createMutationObserver(): MutationObserver {
		return new MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.target instanceof HTMLElement) {
					if (mutation.target.classList.value.includes('ReactVirtualized__Grid__innerScrollContainer')) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage_text_]');

						for (const message of messages) {
							this._replaceEmotesInChatMessage(message);
						}
					} else if (mutation.target.parentElement?.classList.value.includes('ChatBoxBase_root_')) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage_text_]');

						for (const message of messages) {
							this._replaceEmotesInChatMessage(message);
						}
					} else if (mutation.target.classList.value.includes('ChatMessage_text_')) {
						this._replaceEmotesInChatMessage(mutation.target);
					} else if (mutation.target.classList.value.includes('ChatMessage_tooltip_')) {
						mutation.target.style.display = 'none';
					} else if (mutation.target.classList.value.includes('StreamChat_chat_')) {
						for (const addedNode of mutation.addedNodes) {
							if (
								addedNode instanceof HTMLDivElement &&
								addedNode.classList.value.includes('Chat_root_')
							) {
								const emotePickerBtn = addedNode.querySelector('[class*=SmileButton_root_]');
								this._logger.debug(emotePickerBtn);

								if (emotePickerBtn) {
									emotePickerBtn.replaceWith(createEmotePickerButton());
								}
							}
						}
					}
				}
			}
		});
	}

	private _replaceEmotesInChatMessage(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			new Set(['div', 'span', 'b', 'strong', 'i', 'u']),
			child => !(child instanceof HTMLDivElement && child.classList.contains('ChatMessage_tooltip_'))
		);
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (evt.target instanceof Element) {
				let emoteButton: HTMLButtonElement | null = null;

				if (evt.target.classList.contains('BE-emote-picker__button')) {
					emoteButton = evt.target as HTMLButtonElement;
				} else if (evt.target.classList.contains('BE-emote-picker__icon')) {
					emoteButton = evt.target.parentElement! as HTMLButtonElement;
				} else if (evt.target.parentElement?.classList.contains('BE-emote-picker__icon')) {
					emoteButton = evt.target.parentElement.parentElement! as HTMLButtonElement;
				}

				if (emoteButton) {
					if (
						emoteButton.classList.contains('BE-emote-picker__button--active') ||
						this._emotePickerContainer.isShown
					) {
						this._emotePickerContainer.hide();
					} else {
						await this._emotePickerContainer.show(
							emoteButton,
							this._rootContext.globalEmotesByProvider,
							this._channelEmotesByProvider
						);
					}
				} else if (evt.target.classList.contains('BE-emote-picker__overlay')) {
					this._emotePickerContainer.hide();
				} else if (evt.target.classList.contains('cdx-block')) {
					this._updateRedactorCaretPosition(evt.target);
				} else if (
					this._emotePickerContainer.isShown &&
					!evt.target.closest('.BE-emote-picker') &&
					!evt.target.closest('[class*=ChatPublisher_publisherRoot_]')
				) {
					this._emotePickerContainer.hide();
				} else if (
					this._emotePickerContainer.isShown &&
					evt.target.closest('[class*=Publisher_sendContainer_]')
				) {
					this._emotePickerContainer.hide();
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}
}
