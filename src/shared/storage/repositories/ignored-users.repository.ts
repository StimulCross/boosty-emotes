import type { IgnoredUser } from '@shared/models'
import type { LocalStorageProvider } from '../providers/local-storage.provider.ts'
import { Mutex } from '@shared/utils'
import { STORAGE_KEYS } from '../constants.ts'

const mutex = new Mutex()

export class IgnoredUsersRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getAll(): Promise<IgnoredUser[]> {
		const data = await this._storage.get<IgnoredUser[]>(STORAGE_KEYS.IGNORED_USERS)

		return data ?? []
	}

	public async setAll(alerts: IgnoredUser[]): Promise<void> {
		await this._storage.set(STORAGE_KEYS.IGNORED_USERS, alerts)
	}

	public async getIgnoredUserByName(name: string): Promise<IgnoredUser | null> {
		const ignoredUsers = await this.getAll()

		return ignoredUsers.find(u => u.name === name) ?? null
	}

	public async getIgnoredUserByDisplayName(displayName: string): Promise<IgnoredUser | null> {
		const ignoredUsers = await this.getAll()

		return ignoredUsers.find(u => u.displayName === displayName) ?? null
	}

	public async addIgnoredUser(ignoredUser: IgnoredUser): Promise<void> {
		return await mutex.run(async () => {
			const ignoredUsers = await this.getAll()

			const result = ignoredUsers.filter(u => u.id !== ignoredUser.id)
			result.push(ignoredUser)

			await this._storage.set(STORAGE_KEYS.IGNORED_USERS, result)
		})
	}

	public async removeIgnoredUserByName(name: string): Promise<void> {
		await mutex.run(async () => {
			const ignoredUsers = await this.getAll()
			const result = ignoredUsers.filter(u => u.name !== name)

			if (result.length === ignoredUsers.length)
				return

			await this._storage.set(STORAGE_KEYS.IGNORED_USERS, result)
		})
	}
}
