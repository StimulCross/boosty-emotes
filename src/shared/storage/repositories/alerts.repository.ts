import type { Alert } from '@shared/models'
import type { LocalStorageProvider } from '../providers/local-storage.provider.ts'
import { Mutex } from '@shared/utils'
import { STORAGE_KEYS } from '../constants.ts'

const mutex = new Mutex()

export class AlertsRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getAll(): Promise<Alert[]> {
		const data = await this._storage.get<Alert[]>(STORAGE_KEYS.ALERTS)

		return data ?? []
	}

	public async setAll(alerts: Alert[]): Promise<void> {
		await this._storage.set(STORAGE_KEYS.ALERTS, alerts)
	}

	public async removeByKind(kind: Alert['kind']): Promise<void> {
		await mutex.run(async () => {
			const alerts = await this.getAll()
			// eslint-disable-next-line ts/no-unnecessary-condition
			const filtered = alerts.filter(a => a.kind !== kind)

			if (alerts.length !== filtered.length)
				await this.setAll(filtered)
		})
	}
}
