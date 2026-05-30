import type { EmoteAutocompletionSettings } from '@shared/models'
import type { Theme } from '@shared/types'
import type { LocalStorageProvider } from '../providers/local-storage.provider.ts'
import { defaultEmoteAutocompletionSettings, STORAGE_KEYS } from '@shared/storage/constants.ts'
import { Mutex } from '@shared/utils'

const mutex = new Mutex()

export class SettingsRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getTheme(): Promise<Theme> {
		const data = await this._storage.get<Theme>(STORAGE_KEYS.THEME)

		return data ?? 'auto'
	}

	public async setTheme(theme: Theme): Promise<void> {
		await this._storage.set(STORAGE_KEYS.THEME, theme)
	}

	public async getAutocompletionSettings(): Promise<EmoteAutocompletionSettings> {
		const data = await this._storage.get<EmoteAutocompletionSettings>(STORAGE_KEYS.EMOTE_AUTOCOMPLETION_SETTINGS)

		return data ?? defaultEmoteAutocompletionSettings
	}

	public async updateAutocompletionSettings(settings: Partial<EmoteAutocompletionSettings>): Promise<void> {
		await mutex.run(async () => {
			const current = await this.getAutocompletionSettings()
			await this._storage.set(STORAGE_KEYS.EMOTE_AUTOCOMPLETION_SETTINGS, { ...current, ...settings })
		})
	}

	public async resetAutocompletionSettings(): Promise<void> {
		await mutex.run(async () => {
			await this._storage.set(STORAGE_KEYS.EMOTE_AUTOCOMPLETION_SETTINGS, defaultEmoteAutocompletionSettings)
		})
	}
}
