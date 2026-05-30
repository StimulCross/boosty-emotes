import { LocalStorageProvider } from '@shared/storage/providers/local-storage.provider.ts'
import {
	AlertsRepository,
	AuthRepository,
	EmotesRepository,
	FavoriteEmotesRepository,
	IgnoredUsersRepository,
	SettingsRepository,
	StateRepository,
	UsersRepository,
} from '@shared/storage/repositories'

export class Storage {
	private readonly _storage: LocalStorageProvider

	private readonly _alertsRepository: AlertsRepository
	private readonly _authRepository: AuthRepository
	private readonly _emotesRepository: EmotesRepository
	private readonly _favoriteEmotes: FavoriteEmotesRepository
	private readonly _ignoredUsers: IgnoredUsersRepository
	private readonly _settingsRepository: SettingsRepository
	private readonly _stateRepository: StateRepository
	private readonly _usersRepository: UsersRepository

	constructor() {
		this._storage = new LocalStorageProvider()

		this._alertsRepository = new AlertsRepository(this._storage)
		this._authRepository = new AuthRepository(this._storage)
		this._emotesRepository = new EmotesRepository(this._storage)
		this._favoriteEmotes = new FavoriteEmotesRepository(this._storage)
		this._ignoredUsers = new IgnoredUsersRepository(this._storage)
		this._settingsRepository = new SettingsRepository(this._storage)
		this._stateRepository = new StateRepository(this._storage)
		this._usersRepository = new UsersRepository(this._storage)
	}

	public get alerts(): AlertsRepository {
		return this._alertsRepository
	}

	public get auth(): AuthRepository {
		return this._authRepository
	}

	public get emotes(): EmotesRepository {
		return this._emotesRepository
	}

	public get favoriteEmotes(): FavoriteEmotesRepository {
		return this._favoriteEmotes
	}

	public get ignoredUsers(): IgnoredUsersRepository {
		return this._ignoredUsers
	}

	public get settings(): SettingsRepository {
		return this._settingsRepository
	}

	public get state(): StateRepository {
		return this._stateRepository
	}

	public get users(): UsersRepository {
		return this._usersRepository
	}

	public async clear(): Promise<void> {
		await this._storage.clear()
	}
}

export const storage = new Storage()
