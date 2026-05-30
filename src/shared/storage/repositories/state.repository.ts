import type { EmotePickerState, GlobalEmotesState } from '@shared/models'
import type { LocalStorageProvider } from '../providers/local-storage.provider.ts'
import { Mutex } from '@shared/utils'
import { defaultEmotePickerState, defaultGlobalEmotesState, STORAGE_KEYS } from '../constants.ts'

const mutex = new Mutex()

export class StateRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getGlobalEmotesState(): Promise<GlobalEmotesState> {
		const data = await this._storage.get<GlobalEmotesState>(STORAGE_KEYS.GLOBAL_EMOTES_STATE)

		return data ?? defaultGlobalEmotesState
	}

	public async updateGlobalEmotesState(state: Partial<GlobalEmotesState>): Promise<void> {
		const currentState = await this.getGlobalEmotesState()

		return await this._storage.set(STORAGE_KEYS.GLOBAL_EMOTES_STATE, { ...currentState, ...state })
	}

	public async getEmotePickerState(): Promise<EmotePickerState> {
		const data = await this._storage.get<EmotePickerState>(STORAGE_KEYS.EMOTE_PICKER_STATE)

		return data ?? defaultEmotePickerState
	}

	public async updateEmotePickerState(newState: Partial<EmotePickerState>): Promise<void> {
		return await mutex.run(async () => {
			const state = await this.getEmotePickerState()

			return await this._storage.set(STORAGE_KEYS.EMOTE_PICKER_STATE, { ...state, ...newState })
		})
	}
}
