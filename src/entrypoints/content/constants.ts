export const BOOSTY_PROFILE_UPDATE_INTERVAL_MS = 1000 * 60 * 60 * 24

export const BOOSTY_SELECTORS = {
	about: {
		content: 'AboutAuthor-scss--module_content',
	},
	chat: {
		chat: 'Chat-scss--module_root_',
		chatBoxRoot: 'ChatBoxBase-scss--module_root_',
		chatBoxList: 'ChatBoxBase-scss--module_list_',
		messageContainer: 'ChatBoxBase-scss--module_messageContainer_',
		publisher: 'ChatPublisher-scss--module_root_',
		systemMessage: 'ChatSystemMessage-scss--module_root_',
		text: 'ChatMessage-scss--module_text_',
		tooltip: 'ChatMessage-scss--module_tooltip_',
	},
	comments: {
		commentRoot: 'CommentView-scss--module_root_',
		content: 'CommentView-scss--module_content_',
		publisher: 'CommentPublisher-scss--module_root_',
		editedComment: 'EditedComment-scss--module_root_',
	},
	messages: {
		publisher: 'Publisher-scss--module_root_',
		dialogChatWrapper: 'DialogueChat-scss--module_dialogWrapper_',
		dialogMessagesRoot: 'DialogueMessages-scss--module_root_',
		dialogMessageGroup: 'DialogueMessageList-scss--module_messageGroup_',
		dialogMessageWrapper: 'DialogueMessageWrapper-scss--module_root_',
		dialogMessageListScrollContainer: 'DialogueMessageList-scss--module_scrollContainer_',
		messageContent: 'DialogueMessageWrapper-scss--module_content_',
		deletedMessage: 'DeletedMessage-scss--module_root_',
	},
	posts: {
		post: 'Post-scss--module_root_',
		postHeaderWithAuthor: 'PostHeaderWithAuthor-scss--module_authorName_',
		content: 'Post-scss--module_content_',
		postSubscriptionBlockHeading: 'PostSubscriptionBlockBase-scss--module_heading_',
		feed: 'Feed-scss--module_feed',
		feedItemWrap: 'Feed-scss--module_itemWrap_',
		subscriptionBlock: 'PostSubscriptionBlock-scss--module_container_',

		blogPostChangeRoot: 'BlogPostChange-scss--module_root_',
		newPostEditor: 'BlogPostForm-scss--module_editor_',
		miniRichEditor: 'MiniRichEditor-scss--module_editor_',
	},
	publisher: {
		root: 'Publisher-scss--module_root_',
		editor: 'codex-editor',
		redactor: 'codex-editor__redactor',
		ceBlock: 'ce-block',
		cdxBlock: 'cdx-block',
		sendButton: 'Publisher-scss--module_sendContainer_',
	},
	stream: {
		authorName: 'StreamPanel-scss--module_author_',
		chatLayout: 'Layout-scss--module_layout',
		chatToggler: 'StreamChatToggler-scss--module_container_',
		description: 'AboutStream-scss--module_description_',
		page: 'StreamPage-scss--module_root_',
		streamChat: 'Stream-scss--module_chat_',
	},
	subscriptions: {
		itemDescription: 'SubscriptionLevelsItem-scss--module_description_',
	},
	targets: {
		card: 'Targets-scss--module_card_',
		itemDescription: 'TargetItemCommon-scss--module_description_',
	},
	trash: {
		attachedImage: 'AttachedImagesRenderer-scss--module_wrapper_',
		trackingPixel: 'Post-scss--module_trackingPixel_',
		iframe: 'Iframe-scss--module_root_',
	},
	ui: {
		blockRenderer: 'BlockRenderer-scss--module_markupBlock_',
		layoutContent: 'Layout-scss--module_content_',
		scrollableComponent: 'ScrollableComponent-scss--module_root_',
		showMore: 'ShowMore-scss--module_showMore_',
		smileButton: 'SmileButton-scss--module_root_',
		spinner: 'Spinner-scss--module_loader_',
		username: 'UserNameWithBadge-scss--module_name_',
	},
} as const
