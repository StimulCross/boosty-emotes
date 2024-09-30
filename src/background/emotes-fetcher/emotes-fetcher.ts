import { BttvProvider, FfzProvider, SevenTvProvider } from './providers';

export class EmotesFetcher {
	private readonly _stv = new SevenTvProvider();
	private readonly _ffz = new FfzProvider();
	private readonly _bttv = new BttvProvider();

	public get stv(): SevenTvProvider {
		return this._stv;
	}

	public get ffz(): FfzProvider {
		return this._ffz;
	}

	public get bttv(): BttvProvider {
		return this._bttv;
	}
}
