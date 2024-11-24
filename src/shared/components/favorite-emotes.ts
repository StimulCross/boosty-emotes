import { type FavoriteEmote } from '@shared/models/favorite-emote';
import { Store } from '@shared/store';

export class FavoriteEmotes {
	private readonly _userId: string | null;
	private _channelFavoriteEmotes: FavoriteEmote[] | null = null;
	private _globalFavoriteEmotes: FavoriteEmote[];

	constructor(globalFavoriteEmotes: FavoriteEmote[], channelFavoriteEmotes?: FavoriteEmote[], userId?: string) {
		this._globalFavoriteEmotes = globalFavoriteEmotes;
		this._channelFavoriteEmotes = channelFavoriteEmotes ?? null;
		this._userId = userId ?? null;
	}

	public get globalFavoriteEmotes(): FavoriteEmote[] {
		return this._globalFavoriteEmotes;
	}

	public get channelFavoriteEmotes(): FavoriteEmote[] | null {
		return this._channelFavoriteEmotes;
	}

	public isGlobalFavorite(emote: FavoriteEmote): boolean {
		return this._globalFavoriteEmotes.some(
			favoriteEmote =>
				favoriteEmote.id === emote.id &&
				favoriteEmote.provider === emote.provider &&
				favoriteEmote.scope === emote.scope
		);
	}

	public isChannelFavorite(emote: FavoriteEmote): boolean {
		return (
			this._channelFavoriteEmotes?.some(
				favoriteEmote =>
					favoriteEmote.id === emote.id &&
					favoriteEmote.provider === emote.provider &&
					favoriteEmote.scope === emote.scope
			) ?? false
		);
	}

	public async addGlobalEmoteToFavorite(emote: FavoriteEmote): Promise<void> {
		if (this.isGlobalFavorite(emote)) {
			return;
		}

		await Store.addGlobalFavoriteEmote(emote);
		this._globalFavoriteEmotes.push(emote);
	}

	public async removeGlobalEmoteFromFavorite(emote: FavoriteEmote): Promise<void> {
		if (!this.isGlobalFavorite(emote)) {
			return;
		}

		await Store.removeGlobalFavoriteEmote(emote);
		this._globalFavoriteEmotes = this._globalFavoriteEmotes.filter(
			favoriteEmote =>
				!(
					favoriteEmote.id === emote.id &&
					favoriteEmote.provider === emote.provider &&
					favoriteEmote.scope === emote.scope
				)
		);
	}

	public async addChannelEmoteToFavorite(emote: FavoriteEmote): Promise<void> {
		if (!this._userId || this.isChannelFavorite(emote)) {
			return;
		}

		await Store.addChannelFavoriteEmote(this._userId, emote);
		this._channelFavoriteEmotes?.push(emote);
	}

	public async removeChannelEmoteFromFavorite(emote: FavoriteEmote): Promise<void> {
		if (!this._userId || !this.isChannelFavorite(emote)) {
			return;
		}

		await Store.removeChannelFavoriteEmote(this._userId, emote);
		this._channelFavoriteEmotes =
			this._channelFavoriteEmotes?.filter(
				favoriteEmote =>
					!(
						favoriteEmote.id === emote.id &&
						favoriteEmote.provider === emote.provider &&
						favoriteEmote.scope === emote.scope
					)
			) ?? null;
	}
}
