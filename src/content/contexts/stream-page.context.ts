import { createEmotePickerButton } from '@content/templates';
import { replaceEmotesInNode } from '@content/utils';
import type { RootContext } from './root-context';
import { SingleUserContext } from './single-user.context';

export class StreamPageContext extends SingleUserContext {
	private static readonly _streamDescriptionTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);
	private static readonly _chatMessageTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);

	constructor(rootContext: RootContext) {
		super(
			rootContext,
			['ChatPublisher-scss--module_root_'],
			{ bottomOffset: 'calc(100% + 10px', zIndex: '9' },
			{ bottomOffset: 'calc(100% + 10px)', leftOffset: '15px', width: '310px' }
		);
	}

	public async init(): Promise<void> {
		await this._initUser();
		this._initialRender();

		this._logger.debug('Initialized', this._user);
	}

	protected _createMutationObserver(): MutationObserver {
		return new MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.target instanceof HTMLElement) {
					if (
						mutation.target.parentElement?.classList.value.includes('ChatBoxBase-scss--module_list_') &&
						mutation.addedNodes.length > 0
					) {
						for (const node of mutation.addedNodes) {
							if (
								node instanceof HTMLDivElement &&
								node.firstChild instanceof HTMLDivElement &&
								node.firstChild.classList.value.includes('ChatBoxBase-scss--module_messageContainer_')
							) {
								const messageContainer = node.firstChild;

								if (
									messageContainer.firstChild instanceof HTMLDivElement &&
									messageContainer.firstChild.classList.value.includes(
										'ChatSystemMessage-scss--module_root_'
									)
								) {
									continue;
								}

								this._logger.debug('Processing chat message...', messageContainer);

								const message = messageContainer.querySelector(
									'[class*=ChatMessage-scss--module_text_]'
								);

								if (message) {
									this._replaceEmotesInChatMessage(message);
								}
							}
						}
					} else if (mutation.target.parentElement?.classList.value.includes('Layout-scss--module_layout')) {
						if (mutation.addedNodes.length > 0) {
							for (const node of mutation.addedNodes) {
								if (
									node instanceof HTMLElement &&
									node.classList.value.includes('StreamPage-scss--module_root_')
								) {
									this._logger.debug('Processing page update...', node);

									const emotePickerBtn = node.querySelector(
										'[class*=SmileButton-scss--module_root_]'
									);

									if (emotePickerBtn) {
										emotePickerBtn.replaceWith(createEmotePickerButton());
									}

									const description = node.querySelector(
										'[class*=AboutStream-scss--module_description_]'
									);

									if (description) {
										this._replaceEmotesInDescription(description);
									}
								}
							}
						}
					}
					// Hide original tooltip
					else if (mutation.target.classList.value.includes('ChatMessage-scss--module_tooltip_')) {
						console.log(mutation);
						this._logger.debug('Hiding original tooltip...', mutation.target);

						mutation.target.style.display = 'none';
					}
				}
			}
		});
	}

	private _initialRender(): void {
		const emotePickerBtn = this.$root.querySelector('[class*=SmileButton-scss--module_root_]');

		if (emotePickerBtn) {
			emotePickerBtn.replaceWith(createEmotePickerButton());
		}

		const description = this.$root.querySelector('[class*=AboutStream-scss--module_description_]');

		if (description) {
			this._replaceEmotesInDescription(description);
		}

		const messages = this.$root.querySelectorAll('[class*=ChatMessage-scss--module_text_]');

		for (const message of messages) {
			this._replaceEmotesInChatMessage(message);
		}
	}

	private _replaceEmotesInDescription(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			StreamPageContext._streamDescriptionTagsSet
		);
	}

	private _replaceEmotesInChatMessage(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			StreamPageContext._chatMessageTagsSet,
			child => !(child instanceof HTMLDivElement && child.classList.contains('ChatMessage-scss--module_tooltip_'))
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
