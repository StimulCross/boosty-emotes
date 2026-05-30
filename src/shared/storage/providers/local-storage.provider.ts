export class LocalStorageProvider {
	private readonly _storage = browser.storage.local

	public async get<T>(key: string): Promise<T | null> {
		const data = await this._storage.get(key)

		return (data[key] as T | undefined) ?? null
	}

	public async getMany<T = unknown, const K extends readonly string[] = readonly string[]>(
		keys: K,
	): Promise<Partial<Record<K[number], T>>> {
		return await this._storage.get([...keys])
	}

	public async set<T>(key: string, value: T): Promise<void> {
		await this._storage.set({ [key]: value })
	}

	public async remove(key: string | string[]): Promise<void> {
		await this._storage.remove(key)
	}

	public async clear(): Promise<void> {
		await this._storage.clear()
	}
}
