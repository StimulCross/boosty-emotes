import { createEmotePickerButton } from '@content/templates';
import { replaceEmotesInNode } from '@content/utils';
import { type RootContext } from './root-context';
import { SingleUserContext } from './single-user.context';

export class ChannelPageContext extends SingleUserContext {
	constructor(rootContext: RootContext) {
		super(rootContext, ['CommentPublisher_root__', 'ChatPublisher_root_']);
	}

	public async init(): Promise<void> {
		const user = await this._resolveUser();

		if (user) {
			this._user = user;
			await this._updateChannelEmotes(user.twitchProfile.id);
		}

		const aboutContent = this.$root.querySelector('[class*=AboutAuthor_content]');

		if (aboutContent) {
			this._replaceEmotesInAboutSection(aboutContent);
		}

		const feed = this.$root.querySelector('[class^=Feed_feed_]');

		if (feed) {
			const posts = feed.querySelectorAll('[class^=Feed_itemWrap_]');

			for (const post of posts) {
				this._processPost(post);
			}
		}

		const targets = this.$root.querySelectorAll('[class^=TargetItemCommon_description_]');

		for (const target of targets) {
			this._replaceEmotesInTargetDescription(target);
		}

		const subscriptions = this.$root.querySelectorAll('[class^=SubscriptionLevelsItem_description_]');

		for (const subscription of subscriptions) {
			if (subscription.firstChild) {
				this._replaceEmotesInSubscriptionDescription(subscription.firstChild);
			}
		}

		this._logger.debug('Initialized', this._user);
	}

	protected _createMutationObserver(): MutationObserver {
		return new MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.target instanceof HTMLElement) {
					// Watch for re-render of the feed
					if (mutation.target.id === 'column-1') {
						for (const node of mutation.addedNodes) {
							if (node instanceof HTMLElement) {
								if (node.classList.value.startsWith('Feed_feed_')) {
									const posts = node.querySelectorAll('[class^=Feed_itemWrap_]');

									for (const post of posts) {
										this._processPost(post);
									}
								}
							}
						}
					}
					// Watch for about section content updates
					else if (mutation.target.classList.value.includes('AboutAuthor_content_')) {
						for (const node of mutation.addedNodes) {
							this._replaceEmotesInAboutSection(node);
						}
					}
					// Watch for dynamically loading posts on route change
					else if (mutation.target.classList.value.includes('Feed_feed_')) {
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
						!mutation.target.classList.value.includes('CommentPublisher_root__')
					) {
						for (const node of mutation.addedNodes) {
							if (
								node instanceof HTMLElement &&
								!node.classList.value.includes('ShowMore_showMore_') &&
								!node.classList.value.includes('Spinner_loader_')
							) {
								const commentContent = node.querySelector('[class*=CommentView_content_]');

								if (commentContent) {
									this._replaceEmotesInComment(commentContent);
								}
							}
						}
					}
					// Watch for posts update when they are expanding
					else if (mutation.target.classList.value.startsWith('Post_content_')) {
						for (const node of mutation.addedNodes) {
							this._replaceEmotesInPost(node);
						}
					}
					// Watch for re-renders of comments
					else if (mutation.target.classList.value.startsWith('CommentView_content_')) {
						this._replaceEmotesInComment(mutation.target);
					}
					// Update target descriptions on page load
					else if (mutation.target.classList.value.startsWith('Layout_content_')) {
						if (mutation.addedNodes.length > 0) {
							const aboutContent = this.$root.querySelector('[class*=AboutAuthor_content]');

							if (aboutContent) {
								this._replaceEmotesInAboutSection(aboutContent);
							}

							const targets = mutation.target.querySelectorAll('[class^=TargetItemCommon_description_]');

							for (const target of targets) {
								this._replaceEmotesInTargetDescription(target);
							}
						}
					}
					// Update targets descriptions on target cards refresh
					else if (mutation.target.classList.value.includes('Targets_card_')) {
						if (mutation.addedNodes.length > 0) {
							const targets = mutation.target.querySelectorAll('[class^=TargetItemCommon_description_]');

							for (const target of targets) {
								this._replaceEmotesInTargetDescription(target);
							}
						}
					}
					// Update subscription description
					else if (mutation.target.parentElement?.classList.value.startsWith('ScrollableComponent_root_')) {
						this._replaceEmotesInTargetDescription(mutation.target);
					}
					// Stream chat on channel page
					else if (mutation.target.classList.value.includes('ReactVirtualized__Grid__innerScrollContainer')) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage_text_]');

						for (const message of messages) {
							this._replaceEmotesInComment(message);
						}
					} else if (mutation.target.parentElement?.classList.value.includes('ChatBoxBase_root_')) {
						const messages = mutation.target.querySelectorAll('[class*=ChatMessage_text_]');

						for (const message of messages) {
							this._replaceEmotesInComment(message);
						}
					} else if (mutation.target.classList.value.includes('ChatMessage_text_')) {
						this._replaceEmotesInComment(mutation.target);
					} else if (mutation.target.classList.value.includes('ChatMessage_tooltip_')) {
						mutation.target.style.display = 'none';
					} else if (mutation.target.classList.value.includes('StreamChatToggler_container_')) {
						for (const node of mutation.addedNodes) {
							if (node instanceof HTMLElement && node.classList.value.includes('Stream_chat_')) {
								const emoteButton = node.querySelector('[class*=SmileButton_root_]');

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

	private _processPost(post: Element): void {
		if (post instanceof HTMLElement) {
			const content = post.querySelector('[class^=Post_content_]');

			if (content && !content.firstElementChild?.classList.value.includes('PostSubscriptionBlock_container_')) {
				this._replaceEmotesInPost(content);
			}

			const emotePickerBtn = post.querySelector('[class*=SmileButton_root_]');

			if (emotePickerBtn instanceof HTMLButtonElement) {
				emotePickerBtn.replaceWith(createEmotePickerButton());
			}

			const comments = post.querySelectorAll('[class*=CommentView_content_]');

			for (const comment of comments) {
				this._replaceEmotesInComment(comment);
			}
		}
	}

	private _replaceEmotesInAboutSection(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			new Set(['div', 'span', 'b', 'strong', 'i', 'u'])
		);
	}

	private _replaceEmotesInPost(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			new Set(['div', 'span', 'b', 'strong', 'i', 'u', 'article']),
			(child: Node) => {
				if (
					child instanceof Element &&
					(child.classList.value.startsWith('Post_trackingPixel_') ||
						child.classList.value.includes('Iframe_root_'))
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
			new Set(['div', 'span', 'b', 'strong', 'i', 'u', 'article'])
		);
	}

	private _replaceEmotesInComment(node: Node): void {
		replaceEmotesInNode(
			node,
			[this._channelEmotes, this._rootContext.globalEmotes],
			new Set(['div', 'span', 'b', 'strong', 'i', 'u']),
			(child: Node) => {
				if (child instanceof Element && child.classList.value.includes('AttachedImagesRenderer_wrapper_')) {
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
			new Set(['div', 'span', 'b', 'strong', 'i', 'u'])
		);
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (evt.target instanceof Element) {
				let button: HTMLButtonElement | null = null;

				if (evt.target.classList.contains('BE-emote-picker__button')) {
					button = evt.target as HTMLButtonElement;
				} else if (evt.target.classList.contains('BE-emote-picker__icon')) {
					button = evt.target.parentElement! as HTMLButtonElement;
				} else if (evt.target.parentElement?.classList.contains('BE-emote-picker__icon')) {
					button = evt.target.parentElement.parentElement! as HTMLButtonElement;
				}

				if (button) {
					if (
						button.classList.contains('BE-emote-picker__button--active') ||
						this._emotePickerContainer.isShown
					) {
						this._emotePickerContainer.hide();
					} else {
						await this._emotePickerContainer.show(
							button,
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
