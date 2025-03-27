import { createEmotePickerButton } from '@content/templates';
import { replaceEmotesInNode } from '@content/utils';
import { type RootContext } from './root-context';
import { SingleUserContext } from './single-user.context';

export class ChannelPageContext extends SingleUserContext {
	private static readonly _aboutSectionTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);
	private static readonly _postTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u', 'article']);
	private static readonly _targetDescriptionTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);
	private static readonly _commentTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);
	private static readonly _subscriptionDescriptionTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);
	private static readonly _chatMessageTagsSet = new Set(['div', 'span', 'b', 'strong', 'i', 'u']);

	constructor(rootContext: RootContext) {
		super(rootContext, ['CommentPublisher-scss--module_root_', 'ChatPublisher-scss--module_root_']);
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
					if (mutation.target.id === 'root') {
						for (const node of mutation.addedNodes) {
							if (node instanceof HTMLElement) {
								if (node.classList.value.startsWith('App-scss--module_app_')) {
									this._initialRender();
								}
							}
						}
					}
					// Watch for re-render of the feed
					else if (mutation.target.id === 'column-1') {
						for (const node of mutation.addedNodes) {
							if (node instanceof HTMLElement) {
								if (node.classList.value.startsWith('Feed-scss--module_feed')) {
									const posts = node.querySelectorAll('[class^=Feed-scss--module_itemWrap_]');

									for (const post of posts) {
										this._processPost(post);
									}
								}
							}
						}
					}
					// Watch for about section content updates
					else if (mutation.target.classList.value.includes('AboutAuthor-scss--module_content')) {
						for (const node of mutation.addedNodes) {
							this._replaceEmotesInAboutSection(node);
						}
					}
					// Watch for dynamically loading posts on route change
					else if (mutation.target.classList.value.includes('Feed-scss--module_feed')) {
						for (const node of mutation.addedNodes) {
							if (!(node instanceof HTMLElement)) {
								return;
							}

							this._processPost(node);
						}
					}
					// Watch for comments expand
					else if (
						mutation.target.parentElement?.id === 'comments' &&
						!mutation.target.classList.value.includes('CommentPublisher-scss--module_root__')
					) {
						for (const node of mutation.addedNodes) {
							if (
								node instanceof HTMLElement &&
								!node.classList.value.includes('ShowMore-scss--module_showMore_') &&
								!node.classList.value.includes('Spinner-scss--module_loader_')
							) {
								const commentContent = node.querySelector('[class*=CommentView-scss--module_content_]');

								if (commentContent) {
									this._replaceEmotesInComment(commentContent);
								}
							}
						}
					}
					// Watch for posts update when they are expanding
					else if (mutation.target.classList.value.startsWith('Post-scss--module_content_')) {
						for (const node of mutation.addedNodes) {
							this._replaceEmotesInPost(node);
						}
					}
					// Watch for re-renders of comments
					else if (mutation.target.classList.value.startsWith('CommentView-scss--module_content_')) {
						this._replaceEmotesInComment(mutation.target);
					}
					// Update page when layout changes
					else if (mutation.target.classList.value.startsWith('Layout-scss--module_content_')) {
						if (mutation.addedNodes.length > 0) {
							const aboutContent = this.$root.querySelector('[class*=AboutAuthor-scss--module_content]');

							if (aboutContent) {
								this._replaceEmotesInAboutSection(aboutContent);
							}

							const posts = mutation.target.querySelectorAll('[class^=Feed-scss--module_itemWrap_]');

							for (const post of posts) {
								this._processPost(post);
							}

							const targets = mutation.target.querySelectorAll(
								'[class^=TargetItemCommon-scss--module_description_]'
							);

							for (const target of targets) {
								this._replaceEmotesInTargetDescription(target);
							}
						}
					}
					// Update targets descriptions on target cards refresh
					else if (mutation.target.classList.value.includes('Targets-scss--module_card_')) {
						if (mutation.addedNodes.length > 0) {
							const targets = mutation.target.querySelectorAll(
								'[class^=TargetItemCommon-scss--module_description_]'
							);

							for (const target of targets) {
								this._replaceEmotesInTargetDescription(target);
							}
						}
					}
					// Update subscription description
					else if (
						mutation.target.parentElement?.classList.value.startsWith(
							'ScrollableComponent-scss--module_root_'
						)
					) {
						this._replaceEmotesInTargetDescription(mutation.target);
					}
					// Stream chat on channel page
					else if (
						mutation.target.parentElement?.classList.value.includes('ChatBoxBase-scss--module_list_') &&
						mutation.addedNodes.length > 0
					) {
						for (const addedNode of mutation.addedNodes) {
							if (
								addedNode instanceof HTMLDivElement &&
								addedNode.firstChild instanceof HTMLDivElement &&
								addedNode.firstChild.classList.value.includes(
									'ChatBoxBase-scss--module_messageContainer_'
								)
							) {
								const message = addedNode.firstChild.querySelector(
									'[class*=ChatMessage-scss--module_text_]'
								);

								if (message) {
									this._replaceEmotesInChatMessage(message);
								}
							}
						}
					} else if (
						mutation.target.parentElement?.classList.value.includes('ChatBoxBase-scss--module_root_')
					) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage-scss--module_text_]');

						for (const message of messages) {
							this._replaceEmotesInChatMessage(message);
						}
					} else if (mutation.target.classList.value.includes('ChatMessage-scss--module_text_')) {
						this._replaceEmotesInChatMessage(mutation.target);
					}
					// Hide original tooltip
					else if (mutation.target.classList.value.includes('ChatMessage-scss--module_tooltip_')) {
						mutation.target.style.display = 'none';
					}
					// Inject emote picker button
					else if (mutation.target.classList.value.includes('StreamChatToggler-scss--module_container_')) {
						for (const node of mutation.addedNodes) {
							if (
								node instanceof HTMLElement &&
								node.classList.value.includes('Stream-scss--module_chat_')
							) {
								const emoteButton = node.querySelector('[class*=SmileButton-scss--module_root_]');

								if (emoteButton) {
									emoteButton.replaceWith(createEmotePickerButton());
								}
							}
						}
					}
				}
			}
		});
	}

	private _initialRender(): void {
		const aboutContent = this.$root.querySelector('[class*=AboutAuthor-scss--module_content]');

		if (aboutContent) {
			this._replaceEmotesInAboutSection(aboutContent);
		}

		const feed = this.$root.querySelector('[class^=Feed-scss--module_feed]');

		if (feed) {
			const posts = feed.querySelectorAll('[class^=Feed-scss--module_itemWrap_]');

			for (const post of posts) {
				this._processPost(post);
			}
		}

		const targets = this.$root.querySelectorAll('[class^=TargetItemCommon-scss--module_description]');

		for (const target of targets) {
			this._replaceEmotesInTargetDescription(target);
		}

		const subscriptions = this.$root.querySelectorAll('[class^=SubscriptionLevelsItem-scss--module_description_]');

		for (const subscription of subscriptions) {
			if (subscription.firstChild) {
				this._replaceEmotesInSubscriptionDescription(subscription.firstChild);
			}
		}
	}

	private _processPost(post: Element): void {
		if (post instanceof HTMLElement) {
			const content = post.querySelector('[class^=Post-scss--module_content_]');

			if (
				content &&
				!content.firstElementChild?.classList.value.includes('PostSubscriptionBlock-scss--module_container_')
			) {
				this._replaceEmotesInPost(content);
			}

			const emotePickerBtn = post.querySelector('[class*=SmileButton-scss--module_root_]');

			if (emotePickerBtn instanceof HTMLButtonElement) {
				emotePickerBtn.replaceWith(createEmotePickerButton());
			}

			const comments = post.querySelectorAll('[class*=CommentView-scss--module_content_]');

			for (const comment of comments) {
				this._replaceEmotesInComment(comment);
			}
		}
	}

	private _replaceEmotesInAboutSection(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._aboutSectionTagsSet
		);
	}

	private _replaceEmotesInPost(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._postTagsSet,
			(child: Node) => {
				if (
					child instanceof Element &&
					(child.classList.value.startsWith('Post-scss--module_trackingPixel_') ||
						child.classList.value.includes('Iframe-scss--module_root_'))
				) {
					return false;
				}

				return true;
			}
		);
	}

	private _replaceEmotesInTargetDescription(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._targetDescriptionTagsSet
		);
	}

	private _replaceEmotesInComment(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._commentTagsSet,
			(child: Node) => {
				if (
					child instanceof Element &&
					child.classList.value.includes('AttachedImagesRenderer-scss--module_wrapper_')
				) {
					return false;
				}

				return true;
			}
		);
	}

	private _replaceEmotesInSubscriptionDescription(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._subscriptionDescriptionTagsSet
		);
	}

	private _replaceEmotesInChatMessage(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			ChannelPageContext._chatMessageTagsSet,
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
