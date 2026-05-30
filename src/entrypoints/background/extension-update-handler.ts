import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class ExtensionUpdateHandler {
	private readonly _logger = createAppLogger('ExtensionUpdateHandler')

	public init(): void {
		// eslint-disable-next-line ts/no-misused-promises
		browser.runtime.onInstalled.addListener(async details => {
			try {
				if (details.reason === 'update' && details.previousVersion) {
					const previousVersion = details.previousVersion

					if (this._isVersionLess(previousVersion, '1.0.0')) {
						await storage.clear()
					}
				}
			}
			catch (err) {
				this._logger.error('Could not apply updates', err)
				throw err
			}
		})
	}

	private _isVersionLess(v1: string, v2: string): boolean {
		const [m1, i1, p1] = v1.split('.').map(Number)
		const [m2, i2, p2] = v2.split('.').map(Number)

		if (m1 !== m2)
			return m1 < m2

		if (i1 !== i2)
			return i1 < i2

		return p1 < p2
	}
}
