export type AlertType = 'danger' | 'warning' | 'success' | 'info'

export type AlertKind = 'twitchTokenExpired'

export interface Alert {
	type: AlertType
	kind: AlertKind
	isCloseable: boolean
	closedAt?: number
}
