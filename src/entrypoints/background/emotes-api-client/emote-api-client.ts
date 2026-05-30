import { BttvApiClient, FfzApiClient, SevenTvApiClient } from './providers'

export class EmoteApiClient {
	private readonly _stv = new SevenTvApiClient()
	private readonly _ffz = new FfzApiClient()
	private readonly _bttv = new BttvApiClient()

	public get stv(): SevenTvApiClient {
		return this._stv
	}

	public get ffz(): FfzApiClient {
		return this._ffz
	}

	public get bttv(): BttvApiClient {
		return this._bttv
	}
}
