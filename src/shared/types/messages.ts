export type MessageType =
	| 'auth'
	| 'tab_open'
	| 'tab_url_change'
	| 'add_user'
	| 'remove_user'
	| 'login'
	| 'logout'
	| 'global_emotes_update'
	| 'channel_emotes_update';

export interface MessageDataBase {
	type: MessageType;
	data?: object;
}

export interface MessageAddUser {
	type: Extract<MessageType, 'add_user'>;
	data: { userId: string };
}

export interface MessageRemoveUser {
	type: Extract<MessageType, 'remove_user'>;
	data: { userId: string };
}

export interface MessageLogin {
	type: Extract<MessageType, 'login'>;
	success: boolean;
	error?: string;
}

export interface MessageAuth {
	type: Extract<MessageType, 'auth'>;
}

export interface MessageLogout {
	type: Extract<MessageType, 'logout'>;
}

export interface MessageTabOpen {
	type: Extract<MessageType, 'tab_open'>;
}

export interface MessageTabUrlChange {
	type: Extract<MessageType, 'tab_url_change'>;
	data: { url: string };
}

export interface MessageGlobalEmotesUpdate {
	type: Extract<MessageType, 'global_emotes_update'>;
}

export interface MessageChannelEmotesUpdate {
	type: Extract<MessageType, 'channel_emotes_update'>;
	data: { userId: string };
}

export type Message =
	| MessageAuth
	| MessageAddUser
	| MessageRemoveUser
	| MessageLogin
	| MessageLogout
	| MessageTabOpen
	| MessageTabUrlChange
	| MessageGlobalEmotesUpdate
	| MessageChannelEmotesUpdate;
