/* eslint-disable @typescript-eslint/no-unsafe-return */

import browser from 'webextension-polyfill';
import { defaultEmotePickerState, STORE_KEYS } from '@shared/constants';
import { BoostyUserAlreadyExistsError, TwitchUserAlreadyExistsError } from '@shared/errors';
import {
	BttvEmote,
	type BttvEmoteData,
	type Emote,
	type EmoteData,
	type EmotePickerState,
	FfzEmote,
	type FfzEmoteData,
	type GlobalEmotesState,
	type SevenTvEmoteData,
	StvEmote,
	TwitchEmote,
	type TwitchEmoteData,
	type User,
	type UserIdentity,
	type UserState
} from '@shared/models';
import { type FavoriteEmote } from '@shared/models/favorite-emote';
import { type Theme, type ThirdPartyEmoteProvider, type ThirdPartyProviderEmotesSets } from '@shared/types';

const store = browser.storage.local;

export class Store {
	private static readonly _globalStorageEntries = new Set([
		STORE_KEYS.GLOBAL_EMOTES_STATE,
		STORE_KEYS.TWITCH_GLOBAL_EMOTES,
		STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
		STORE_KEYS.FFZ_GLOBAL_EMOTES,
		STORE_KEYS.BTTV_GLOBAL_EMOTES,
		STORE_KEYS.THEME
	]);

	public static async clear(): Promise<void> {
		await store.clear();
	}

	public static async clearIdentityAndUsers(): Promise<void> {
		const storage = await store.get();
		await store.remove(Object.keys(storage).filter(key => !Store._globalStorageEntries.has(key)));
	}

	public static async getTheme(): Promise<Theme> {
		const data = await store.get(STORE_KEYS.THEME);
		return data[STORE_KEYS.THEME] ?? 'light';
	}

	public static async setTheme(theme: Theme): Promise<void> {
		await store.set({ [STORE_KEYS.THEME]: theme });
	}

	public static async getTwitchAccessToken(): Promise<string | null> {
		const data = await store.get(STORE_KEYS.TWITCH_ACCESS_TOKEN);
		return data[STORE_KEYS.TWITCH_ACCESS_TOKEN] ?? null;
	}

	public static async setTwitchAccessToken(token: string | null): Promise<void> {
		if (token) {
			await store.set({ [STORE_KEYS.TWITCH_ACCESS_TOKEN]: token });
		} else {
			await store.remove(STORE_KEYS.TWITCH_ACCESS_TOKEN);
		}
	}

	public static async getIdentity(): Promise<UserIdentity | null> {
		const data = await store.get(STORE_KEYS.IDENTITY);
		return data[STORE_KEYS.IDENTITY] ?? null;
	}

	public static async setIdentity(profile: UserIdentity | null): Promise<void> {
		if (profile) {
			await store.set({ [STORE_KEYS.IDENTITY]: profile });
		} else {
			await store.remove(STORE_KEYS.IDENTITY);
		}
	}

	public static async getUsers(): Promise<User[]> {
		const data = await store.get(STORE_KEYS.USERS);
		return data[STORE_KEYS.USERS] ?? [];
	}

	public static async getUser(userId: string): Promise<User | null> {
		const users = await this.getUsers();
		return users.find(user => user.twitchProfile.id === userId) ?? null;
	}

	public static async getUserByBoostyName(name: string): Promise<User | null> {
		name = name.toLowerCase();
		const users = await this.getUsers();
		const user = users.find(({ boostyUsername }) => boostyUsername === name);
		return user ?? null;
	}

	public static async getGlobalFavoriteEmotes(): Promise<FavoriteEmote[]> {
		const data = await store.get(STORE_KEYS.GLOBAL_FAVORITE_EMOTES);
		return data[STORE_KEYS.GLOBAL_FAVORITE_EMOTES] ?? [];
	}

	public static async addGlobalFavoriteEmote(emote: FavoriteEmote): Promise<void> {
		const favoriteEmotes = await this.getGlobalFavoriteEmotes();
		const existingFavoriteEmote = favoriteEmotes.find(
			favoriteEmote =>
				favoriteEmote.id === emote.id &&
				favoriteEmote.provider === emote.provider &&
				favoriteEmote.scope === emote.scope
		);

		if (existingFavoriteEmote) {
			return;
		}

		favoriteEmotes.push({ provider: emote.provider, scope: emote.scope, id: emote.id });
		await store.set({ [STORE_KEYS.GLOBAL_FAVORITE_EMOTES]: favoriteEmotes });
	}

	public static async removeGlobalFavoriteEmote(emote: FavoriteEmote): Promise<void> {
		const favoriteEmotes = await this.getGlobalFavoriteEmotes();
		await store.set({
			[STORE_KEYS.GLOBAL_FAVORITE_EMOTES]: favoriteEmotes.filter(
				favoriteEmote =>
					!(
						favoriteEmote.id === emote.id &&
						favoriteEmote.provider === emote.provider &&
						favoriteEmote.scope === emote.scope
					)
			)
		});
	}

	public static async getChannelFavoriteEmotes(userId: string): Promise<FavoriteEmote[]> {
		const key = `${STORE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`;
		const data = await store.get(key);
		return data[key] ?? [];
	}

	public static async addChannelFavoriteEmote(userId: string, emote: FavoriteEmote): Promise<void> {
		const key = `${STORE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`;

		const favoriteEmotes = await this.getChannelFavoriteEmotes(userId);
		const existingFavoriteEmote = favoriteEmotes.find(
			favoriteEmote =>
				favoriteEmote.id === emote.id &&
				favoriteEmote.provider === emote.provider &&
				favoriteEmote.scope === emote.scope
		);

		if (existingFavoriteEmote) {
			return;
		}

		favoriteEmotes.push({ provider: emote.provider, scope: emote.scope, id: emote.id });
		await store.set({ [key]: favoriteEmotes });
	}

	public static async removeChannelFavoriteEmote(userId: string, emote: FavoriteEmote): Promise<void> {
		const key = `${STORE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`;

		const favoriteEmotes = await this.getChannelFavoriteEmotes(userId);
		await store.set({
			[key]: favoriteEmotes.filter(
				favoriteEmote =>
					!(
						favoriteEmote.id === emote.id &&
						favoriteEmote.provider === emote.provider &&
						favoriteEmote.scope === emote.scope
					)
			)
		});
	}

	public static async addUser(user: User): Promise<void> {
		user.boostyUsername = user.boostyUsername.toLowerCase();
		const users = await this.getUsers();

		const existingBoostyUser = users.find(({ boostyUsername }) => boostyUsername === user.boostyUsername);

		if (existingBoostyUser) {
			throw new BoostyUserAlreadyExistsError(
				`Boosty user @${user.boostyUsername} already exists.`,
				user.boostyUsername,
				user.twitchProfile.displayName
			);
		}

		const existingTwitchUser = users.find(({ twitchProfile }) => twitchProfile.id === user.twitchProfile.id);

		if (existingTwitchUser) {
			throw new TwitchUserAlreadyExistsError(
				`Twitch user @${user.twitchProfile.displayName} already exists.`,
				user.boostyUsername,
				user.twitchProfile.displayName
			);
		}

		users.push(user);
		await store.set({ [STORE_KEYS.USERS]: [...users] });
	}

	public static async updateUser(twitchProfile: UserIdentity, state: Partial<UserState> = {}): Promise<void> {
		const users = await this.getUsers();

		for (const user of users) {
			if (user.twitchProfile.id === twitchProfile.id) {
				user.twitchProfile = twitchProfile;
				user.state = { ...user.state, ...state };
			}
		}

		await this._setUsers(users);
	}

	public static async removeUser(username: string): Promise<void> {
		username = username.toLowerCase();
		const users = await this.getUsers();
		const user = users.find(usr => usr.boostyUsername === username);

		if (!user) {
			return;
		}

		const newUsers = users.filter(({ boostyUsername }) => username !== boostyUsername);
		await store.set({ [STORE_KEYS.USERS]: [...newUsers] });

		const userId = user.twitchProfile.id;
		await store.remove([
			this._getTwitchChannelEmotesKey(userId),
			this._getSevenTvChannelEmotesKey(userId),
			this._getFfzChannelEmotesKey(userId),
			this._getBttvChannelEmotesKey(userId)
		]);
	}

	public static async getGlobalEmotesState(): Promise<GlobalEmotesState | null> {
		const data = await store.get(STORE_KEYS.GLOBAL_EMOTES_STATE);
		return data[STORE_KEYS.GLOBAL_EMOTES_STATE] ?? null;
	}

	public static async updateTwitchGlobalEmotesState(newState: Partial<GlobalEmotesState>): Promise<void> {
		const state = await this.getGlobalEmotesState();
		await store.set({ [STORE_KEYS.GLOBAL_EMOTES_STATE]: { ...state, ...newState } });
	}

	public static async getGlobalEmotes(): Promise<Emote[]> {
		const data = (await store.get([
			STORE_KEYS.TWITCH_GLOBAL_EMOTES,
			STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
			STORE_KEYS.FFZ_GLOBAL_EMOTES,
			STORE_KEYS.BTTV_GLOBAL_EMOTES
		])) as Partial<Record<string, EmoteData[]>>;

		const result: Emote[] = [];

		// The order in which emotes are inserted does matter.
		// It represents the priority of displaying the emotes.
		// The last ones have the highest priority.

		data[STORE_KEYS.BTTV_GLOBAL_EMOTES]?.forEach(emote => {
			result.push(new BttvEmote(emote));
		});

		data[STORE_KEYS.FFZ_GLOBAL_EMOTES]?.forEach(emote => {
			result.push(new FfzEmote(emote));
		});

		data[STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES]?.forEach(emote => {
			result.push(new StvEmote(emote));
		});

		data[STORE_KEYS.TWITCH_GLOBAL_EMOTES]?.forEach(emote => {
			result.push(new TwitchEmote(emote));
		});

		return result;
	}

	public static async getChannelEmotes(userId: string): Promise<Emote[]> {
		const twitchChannelEmotesKey = this._getTwitchChannelEmotesKey(userId);
		const sevenTvChannelEmotesKey = this._getSevenTvChannelEmotesKey(userId);
		const ffzChannelEmotesKey = this._getFfzChannelEmotesKey(userId);
		const bttvChannelEmotesKey = this._getBttvChannelEmotesKey(userId);

		const data = (await store.get([
			twitchChannelEmotesKey,
			sevenTvChannelEmotesKey,
			ffzChannelEmotesKey,
			bttvChannelEmotesKey
		])) as Partial<Record<string, EmoteData[]>>;

		const result: Emote[] = [];

		// The order in which emotes are inserted does matter.
		// It represents the priority of displaying the emotes.
		// The last ones have the highest priority.

		data[bttvChannelEmotesKey]?.forEach(emote => {
			result.push(new BttvEmote(emote));
		});

		data[ffzChannelEmotesKey]?.forEach(emote => {
			result.push(new FfzEmote(emote));
		});

		data[sevenTvChannelEmotesKey]?.forEach(emote => {
			result.push(new StvEmote(emote));
		});

		data[twitchChannelEmotesKey]?.forEach(emote => {
			result.push(new TwitchEmote(emote));
		});

		return result;
	}

	public static async getGlobalEmotesByProvider(): Promise<ThirdPartyProviderEmotesSets> {
		const data = (await store.get([
			STORE_KEYS.TWITCH_GLOBAL_EMOTES,
			STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
			STORE_KEYS.FFZ_GLOBAL_EMOTES,
			STORE_KEYS.BTTV_GLOBAL_EMOTES
		])) as Partial<Record<string, EmoteData[]>>;

		return new Map<ThirdPartyEmoteProvider, Map<string, Emote>>([
			[
				'twitch',
				new Map<string, Emote>(
					data[STORE_KEYS.TWITCH_GLOBAL_EMOTES]?.map(emote => [emote.id, new TwitchEmote(emote)]) ?? []
				)
			],
			[
				'7tv',
				new Map<string, Emote>(
					data[STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES]?.map(emote => [emote.id, new StvEmote(emote)]) ?? []
				)
			],
			[
				'ffz',
				new Map<string, Emote>(
					data[STORE_KEYS.FFZ_GLOBAL_EMOTES]?.map(emote => [emote.id, new FfzEmote(emote)]) ?? []
				)
			],
			[
				'bttv',
				new Map<string, Emote>(
					data[STORE_KEYS.BTTV_GLOBAL_EMOTES]?.map(emote => [emote.id, new BttvEmote(emote)]) ?? []
				)
			]
		]);
	}

	public static async getChannelEmotesByProvider(userId: string): Promise<ThirdPartyProviderEmotesSets> {
		const twitchChannelEmotesKey = this._getTwitchChannelEmotesKey(userId);
		const sevenTvChannelEmotesKey = this._getSevenTvChannelEmotesKey(userId);
		const ffzChannelEmotesKey = this._getFfzChannelEmotesKey(userId);
		const bttvChannelEmotesKey = this._getBttvChannelEmotesKey(userId);

		const data = (await store.get([
			twitchChannelEmotesKey,
			sevenTvChannelEmotesKey,
			ffzChannelEmotesKey,
			bttvChannelEmotesKey
		])) as Partial<Record<string, EmoteData[]>>;

		return new Map([
			[
				'twitch',
				new Map<string, Emote>(
					data[twitchChannelEmotesKey]?.map(emote => [emote.id, new TwitchEmote(emote)]) ?? []
				)
			],
			[
				'7tv',
				new Map<string, Emote>(
					data[sevenTvChannelEmotesKey]?.map(emote => [emote.id, new StvEmote(emote)]) ?? []
				)
			],
			[
				'ffz',
				new Map<string, Emote>(data[ffzChannelEmotesKey]?.map(emote => [emote.id, new FfzEmote(emote)]) ?? [])
			],
			[
				'bttv',
				new Map<string, Emote>(data[bttvChannelEmotesKey]?.map(emote => [emote.id, new BttvEmote(emote)]) ?? [])
			]
		]) satisfies ThirdPartyProviderEmotesSets;
	}

	public static async getTwitchGlobalEmotes(): Promise<TwitchEmoteData[]> {
		const data = (await store.get(STORE_KEYS.TWITCH_GLOBAL_EMOTES)) as Partial<Record<string, TwitchEmoteData[]>>;
		return data[STORE_KEYS.TWITCH_GLOBAL_EMOTES] ?? [];
	}

	public static async setTwitchGlobalEmotes(emotes: TwitchEmote[]): Promise<void> {
		await store.set({ [STORE_KEYS.TWITCH_GLOBAL_EMOTES]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getSevenTvGlobalEmotes(): Promise<SevenTvEmoteData[]> {
		const data = (await store.get(STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES)) as Partial<
			Record<string, SevenTvEmoteData[]>
		>;
		return data[STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES] ?? [];
	}

	public static async setSevenTvGlobalEmotes(emotes: StvEmote[]): Promise<void> {
		await store.set({ [STORE_KEYS.SEVEN_TV_GLOBAL_EMOTES]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getFfzGlobalEmotes(): Promise<FfzEmoteData[]> {
		const data = (await store.get(STORE_KEYS.FFZ_GLOBAL_EMOTES)) as Partial<Record<string, FfzEmoteData[]>>;
		return data[STORE_KEYS.FFZ_GLOBAL_EMOTES] ?? [];
	}

	public static async setFfzGlobalEmotes(emotes: FfzEmote[]): Promise<void> {
		await store.set({ [STORE_KEYS.FFZ_GLOBAL_EMOTES]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getBttvGlobalEmotes(): Promise<BttvEmoteData[]> {
		const data = (await store.get(STORE_KEYS.BTTV_GLOBAL_EMOTES)) as Partial<Record<string, BttvEmoteData[]>>;
		return data[STORE_KEYS.FFZ_GLOBAL_EMOTES] ?? [];
	}

	public static async setBttvGlobalEmotes(emotes: BttvEmote[]): Promise<void> {
		await store.set({ [STORE_KEYS.BTTV_GLOBAL_EMOTES]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getTwitchChannelEmotes(userId: string): Promise<TwitchEmoteData[]> {
		const key = this._getTwitchChannelEmotesKey(userId);
		const data = (await store.get(key)) as Partial<Record<string, TwitchEmoteData[]>>;
		return data[key] ?? [];
	}

	public static async setTwitchChannelEmotes(userId: string, emotes: TwitchEmote[]): Promise<void> {
		await store.set({ [this._getTwitchChannelEmotesKey(userId)]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getSevenTvChannelEmotes(userId: string): Promise<SevenTvEmoteData[]> {
		const key = this._getSevenTvChannelEmotesKey(userId);
		const data = (await store.get(key)) as Partial<Record<string, SevenTvEmoteData[]>>;
		return data[key] ?? [];
	}

	public static async setSevenTvChannelEmotes(userId: string, emotes: StvEmote[]): Promise<void> {
		await store.set({ [this._getSevenTvChannelEmotesKey(userId)]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getFfzChannelEmotes(userId: string): Promise<FfzEmoteData[]> {
		const key = this._getFfzChannelEmotesKey(userId);
		const data = (await store.get(key)) as Partial<Record<string, FfzEmoteData[]>>;
		return data[key] ?? [];
	}

	public static async setFfzChannelEmotes(userId: string, emotes: FfzEmote[]): Promise<void> {
		await store.set({ [this._getFfzChannelEmotesKey(userId)]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getBttvChannelEmotes(userId: string): Promise<BttvEmoteData[]> {
		const key = this._getBttvChannelEmotesKey(userId);
		const data = (await store.get(key)) as Partial<Record<string, BttvEmoteData[]>>;
		return data[key] ?? [];
	}

	public static async setBttvChannelEmotes(userId: string, emotes: BttvEmote[]): Promise<void> {
		await store.set({ [this._getBttvChannelEmotesKey(userId)]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getEmotePickerState(): Promise<EmotePickerState> {
		const data = await store.get(STORE_KEYS.EMOTE_PICKER_STATE);
		return data[STORE_KEYS.EMOTE_PICKER_STATE] ?? defaultEmotePickerState;
	}

	public static async setEmotePickerState(newState: EmotePickerState): Promise<void> {
		const state = await this.getEmotePickerState();
		await store.set({ [STORE_KEYS.EMOTE_PICKER_STATE]: { ...state, ...newState } });
	}

	private static async _setUsers(users: User[]): Promise<void> {
		await store.set({ [STORE_KEYS.USERS]: users });
	}

	private static _getTwitchChannelEmotesKey(userId: string): string {
		return `${STORE_KEYS.TWITCH_CHANNEL_EMOTES_PREFIX}${userId}}`;
	}

	private static _getSevenTvChannelEmotesKey(userId: string): string {
		return `${STORE_KEYS.SEVEN_TV_CHANNEL_EMOTES_PREFIX}${userId}}`;
	}

	private static _getFfzChannelEmotesKey(userId: string): string {
		return `${STORE_KEYS.FFZ_CHANNEL_EMOTES_PREFIX}${userId}}`;
	}

	private static _getBttvChannelEmotesKey(userId: string): string {
		return `${STORE_KEYS.BTTV_CHANNEL_EMOTES_PREFIX}${userId}}`;
	}
}
