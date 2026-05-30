import type { ChannelEmote, GlobalThirdPartyEmote } from '@shared/models'
import type { ChannelFavoriteEmote, GlobalFavoriteEmote } from '@shared/models/favorite-emote.ts'

export type MessageType
	= | 'auth'
		| 'add_global_favorite_emote'
		| 'remove_global_favorite_emote'
		| 'add_channel_favorite_emote'
		| 'remove_channel_favorite_emote'
		| 'tab_open'
		| 'tab_url_change'
		| 'add_user'
		| 'remove_user'
		| 'login'
		| 'logout'
		| 'global_emotes_update'
		| 'channel_emotes_update'
		| 'global_favorite_emotes_update'
		| 'channel_favorite_emotes_update'

export interface MessageDataBase {
	type: MessageType
	data?: object
}

export interface CommandMessageAuth extends MessageDataBase {
	type: Extract<MessageType, 'auth'>
}

export interface CommandMessageAddGlobalFavoriteEmote extends MessageDataBase {
	type: Extract<MessageType, 'add_global_favorite_emote'>
	data: { emote: GlobalFavoriteEmote }
}

export interface CommandMessageRemoveGlobalFavoriteEmote extends MessageDataBase {
	type: Extract<MessageType, 'remove_global_favorite_emote'>
	data: { emote: GlobalFavoriteEmote }
}

export interface CommandMessageAddChannelFavoriteEmote extends MessageDataBase {
	type: Extract<MessageType, 'add_channel_favorite_emote'>
	data: { userId: string, emote: ChannelFavoriteEmote }
}

export interface CommandMessageRemoveChannelFavoriteEmote extends MessageDataBase {
	type: Extract<MessageType, 'remove_channel_favorite_emote'>
	data: { userId: string, emote: ChannelFavoriteEmote }
}

export interface EventMessageAddUser extends MessageDataBase {
	type: Extract<MessageType, 'add_user'>
	data: { userId: string }
}

export interface EventMessageRemoveUser extends MessageDataBase {
	type: Extract<MessageType, 'remove_user'>
	data: { userId: string }
}

export interface EventMessageLogin extends MessageDataBase {
	type: Extract<MessageType, 'login'>
	success: boolean
	error?: string
}

export interface EventMessageLogout extends MessageDataBase {
	type: Extract<MessageType, 'logout'>
}

export interface EventMessageTabOpen extends MessageDataBase {
	type: Extract<MessageType, 'tab_open'>
}

export interface EventMessageTabUrlChange {
	type: Extract<MessageType, 'tab_url_change'>
	data: { url: string }
}

export interface EventMessageGlobalEmotesUpdate extends MessageDataBase {
	type: Extract<MessageType, 'global_emotes_update'>
	data: {
		added: GlobalThirdPartyEmote[]
		removed: GlobalThirdPartyEmote[]
	}
}

export interface EventMessageChannelEmotesUpdate extends MessageDataBase {
	type: Extract<MessageType, 'channel_emotes_update'>
	data: {
		userId: string
		added: ChannelEmote[]
		removed: ChannelEmote[]
	}
}

export interface EventMessageGlobalFavoriteEmotesUpdate extends MessageDataBase {
	type: Extract<MessageType, 'global_favorite_emotes_update'>
	data: {
		added: GlobalFavoriteEmote[]
		removed: GlobalFavoriteEmote[]
	}
}

export interface EventMessageChannelFavoriteEmotesUpdate extends MessageDataBase {
	type: Extract<MessageType, 'channel_favorite_emotes_update'>
	data: {
		userId: string
		added: ChannelFavoriteEmote[]
		removed: ChannelFavoriteEmote[]
	}
}

export type CommandMessage
	= | CommandMessageAuth
		| CommandMessageAddGlobalFavoriteEmote
		| CommandMessageRemoveGlobalFavoriteEmote
		| CommandMessageAddChannelFavoriteEmote
		| CommandMessageRemoveChannelFavoriteEmote

export type EventMessage
	= | EventMessageLogin
		| EventMessageLogout
		| EventMessageTabOpen
		| EventMessageTabUrlChange
		| EventMessageGlobalEmotesUpdate
		| EventMessageChannelEmotesUpdate
		| EventMessageAddUser
		| EventMessageRemoveUser
		| EventMessageGlobalFavoriteEmotesUpdate
		| EventMessageChannelFavoriteEmotesUpdate

export type Message = CommandMessage | EventMessage
