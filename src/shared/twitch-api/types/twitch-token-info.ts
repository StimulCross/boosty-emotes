export interface TwitchTokenInfo {
	client_id: string
	login: string
	scopes: string[] | null
	user_id: string
	expires_in: number
}
