export function getTwitchClientId(): string {
	if (import.meta.env.BROWSER === 'firefox') {
		// eslint-disable-next-line ts/no-unsafe-return
		return import.meta.env.WXT_FIREFOX_TWITCH_CLIENT_ID
	}

	// eslint-disable-next-line ts/no-unsafe-return
	return import.meta.env.WXT_CHROMIUM_TWITCH_CLIENT_ID
}
