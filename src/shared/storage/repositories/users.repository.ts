import type { LocalStorageProvider } from '@shared/storage/providers/local-storage.provider.ts'
import type { BoostyUser, TwitchUser, User, UserState } from '../../models'
import { STORAGE_KEYS } from '@shared/storage/constants.ts'
import { Mutex } from '@shared/utils'
import { BoostyUserAlreadyExistsError, TwitchUserAlreadyExistsError } from '../../errors'

const mutex = new Mutex()

export class UsersRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getAll(): Promise<User[]> {
		const data = await this._storage.get<User[]>(STORAGE_KEYS.USERS)

		return data ?? []
	}

	public async getByTwitchId(userId: string): Promise<User | null> {
		const users = await this.getAll()

		return users.find(u => u.twitchProfile.id === userId) ?? null
	}

	public async getByBoostyName(name: string): Promise<User | null> {
		const users = await this.getAll()

		return users.find(u => u.boostyProfile.name === name) ?? null
	}

	public async getByBoostyDisplayName(displayName: string): Promise<User | null> {
		const users = await this.getAll()

		return users.find(u => u.boostyProfile.displayName === displayName) ?? null
	}

	public async add(twitchProfile: TwitchUser, boostyProfile: BoostyUser): Promise<void> {
		await mutex.run(async () => {
			const users = await this.getAll()

			if (users.some(u => u.boostyProfile.name === boostyProfile.name)) {
				throw new BoostyUserAlreadyExistsError(
					`Boosty user @${boostyProfile.name} already exists`,
					boostyProfile.name,
					twitchProfile.displayName,
				)
			}

			if (users.some(u => u.twitchProfile.id === twitchProfile.id)) {
				throw new TwitchUserAlreadyExistsError(
					`Twitch user @${twitchProfile.name} already exists with ID ${twitchProfile.id}`,
					boostyProfile.name,
					twitchProfile.displayName,
				)
			}

			users.push({
				boostyProfile: { id: boostyProfile.id, name: boostyProfile.name, displayName: boostyProfile.displayName },
				twitchProfile,
				state: this._createEmptyUserState(),
			})

			await this._setAll(users)
		})
	}

	public async remove(userId: string): Promise<void> {
		await mutex.run(async () => {
			const users = await this.getAll()
			await this._setAll(users.filter(u => u.twitchProfile.id !== userId))
		})
	}

	public async setBoostyProfileData(
		userId: string,
		profileUpdate: Required<Pick<BoostyUser, 'id' | 'displayName'>>,
	): Promise<void> {
		await mutex.run(async () => {
			const users = await this.getAll()
			const userIndex = users.findIndex(u => u.twitchProfile.id === userId)

			if (userIndex !== -1) {
				const now = Date.now()

				users[userIndex].boostyProfile.id = profileUpdate.id
				users[userIndex].boostyProfile.displayName = profileUpdate.displayName
				users[userIndex].state = { ...users[userIndex].state, boostyProfileUpdatedAt: now, updatedAt: now }

				await this._setAll(users)
			}
		})
	}

	public async updateTwitchData(userId: string, profileUpdate: TwitchUser, stateUpdate: UserState): Promise<void> {
		await mutex.run(async () => {
			const users = await this.getAll()
			const userIndex = users.findIndex(u => u.twitchProfile.id === userId)

			if (userIndex !== -1) {
				users[userIndex].twitchProfile = { ...users[userIndex].twitchProfile, ...profileUpdate }
				users[userIndex].state = { ...users[userIndex].state, ...stateUpdate }
				await this._setAll(users)
			}
		})
	}

	public async updateState(userId: string, stateUpdate: Partial<UserState>): Promise<void> {
		await mutex.run(async () => {
			const users = await this.getAll()
			const userIndex = users.findIndex(u => u.twitchProfile.id === userId)

			if (userIndex !== -1) {
				users[userIndex].state = { ...users[userIndex].state, ...stateUpdate }
				await this._setAll(users)
			}
		})
	}

	private async _setAll(users: User[]): Promise<void> {
		await this._storage.set(STORAGE_KEYS.USERS, users)
	}

	private _createEmptyUserState(): UserState {
		return {
			active: true,
			boostyProfileUpdatedAt: 0,
			twitchEmotesUpdatedAt: 0,
			sevenTvEmotesUpdatedAt: 0,
			ffzEmotesUpdatedAt: 0,
			bttvEmotesUpdatedAt: 0,
			updatedAt: 0,
		}
	}
}
