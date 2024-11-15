import { createEmotePickerButton } from '@content/templates';
import { replaceEmotesInNode } from '@content/utils';
import type { RootContext } from './root-context';
import { SingleUserContext } from './single-user.context';

export class ChatOnlyPageContext extends SingleUserContext {
	private static readonly _chatMessageTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);

	constructor(rootContext: RootContext) {
		super(rootContext, ['ChatPublisher_root_'], { bottomOffset: -10, zIndex: 9 });
	}

	public async init(): Promise<void> {
		await this._initUser();

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
					if (
						mutation.target.parentElement?.classList.value.includes('ChatBoxBase_list_') &&
						mutation.addedNodes.length > 0
					) {
						for (const addedNode of mutation.addedNodes) {
							if (
								addedNode instanceof HTMLDivElement &&
								addedNode.firstChild instanceof HTMLDivElement &&
								addedNode.firstChild.classList.value.includes('ChatBoxBase_messageContainer_')
							) {
								const message = addedNode.firstChild.querySelector('[class*=ChatMessage_text_]');

								if (message) {
									this._replaceEmotesInChatMessage(message);
								}
							}
						}
					} else if (mutation.target.parentElement?.classList.value.includes('ChatBoxBase_root_')) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage_text_]');

						for (const message of messages) {
							this._replaceEmotesInChatMessage(message);
						}
					} else if (mutation.target.classList.value.includes('ChatMessage_text_')) {
						this._replaceEmotesInChatMessage(mutation.target);
					}
					// Hide original tooltip
					else if (mutation.target.classList.value.includes('ChatMessage_tooltip_')) {
						mutation.target.style.display = 'none';
					}
					// Inject emote picker button
					else if (mutation.target.classList.value.includes('StreamChat_chat_')) {
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
			ChatOnlyPageContext._chatMessageTagsSet,
			child => !(child instanceof HTMLDivElement && child.classList.contains('ChatMessage_tooltip_'))
		);
	}

	private _onClick(evt: MouseEvent): void {
		try {
			if (evt.target instanceof Element && evt.target.classList.contains('cdx-block')) {
				this._updateRedactorCaretPosition(evt.target);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}
}
