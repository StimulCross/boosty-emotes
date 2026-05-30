import type { TwitchUser } from '@shared/models'
import type { AccessToken } from '../../types/access-token'
import type { LocalStorageProvider } from '../providers/local-storage.provider.ts'
import { STORAGE_KEYS } from '@shared/storage/constants.ts'

export class AuthRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getAccessToken(): Promise<AccessToken | null> {
		return await this._storage.get<AccessToken>(STORAGE_KEYS.TWITCH_ACCESS_TOKEN)
	}

	public async setAccessToken(token: AccessToken | null): Promise<void> {
		await this._storage.set(STORAGE_KEYS.TWITCH_ACCESS_TOKEN, token)
	}

	public async getIdentity(): Promise<TwitchUser | null> {
		return await this._storage.get<TwitchUser>(STORAGE_KEYS.IDENTITY)
	}

	public async setIdentity(identity: TwitchUser | null): Promise<void> {
		await this._storage.set(STORAGE_KEYS.IDENTITY, identity)
	}
}
