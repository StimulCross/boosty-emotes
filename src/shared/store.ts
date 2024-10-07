/* eslint-disable @typescript-eslint/no-unsafe-return */

import browser from 'webextension-polyfill';
import { defaultEmotePickerState, StoreKeys } from '@shared/constants';
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
import { type Theme, type ThirdPartyEmoteProvider, type ThirdPartyProviderEmotesSets } from '@shared/types';

const store = browser.storage.local;

export class Store {
	public static async clear(): Promise<void> {
		await store.clear();
	}

	public static async getTheme(): Promise<Theme> {
		const data = await store.get(StoreKeys.Theme);
		return data[StoreKeys.Theme] ?? 'light';
	}

	public static async setTheme(theme: Theme): Promise<void> {
		await store.set({ [StoreKeys.Theme]: theme });
	}

	public static async getTwitchAccessToken(): Promise<string | null> {
		const data = await store.get(StoreKeys.TwitchAccessToken);
		return data[StoreKeys.TwitchAccessToken] ?? null;
	}

	public static async setTwitchAccessToken(token: string | null): Promise<void> {
		if (token) {
			await store.set({ [StoreKeys.TwitchAccessToken]: token });
		} else {
			await store.remove(StoreKeys.TwitchAccessToken);
		}
	}

	public static async getIdentity(): Promise<UserIdentity | null> {
		const data = await store.get(StoreKeys.Identity);
		return data[StoreKeys.Identity] ?? null;
	}

	public static async setIdentity(profile: UserIdentity | null): Promise<void> {
		if (profile) {
			await store.set({ [StoreKeys.Identity]: profile });
		} else {
			await store.remove(StoreKeys.Identity);
		}
	}

	public static async getUsers(): Promise<User[]> {
		const data = await store.get(StoreKeys.Users);
		return data[StoreKeys.Users] ?? [];
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
		await store.set({ [StoreKeys.Users]: [...users] });
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
		await store.set({ [StoreKeys.Users]: [...newUsers] });

		const userId = user.twitchProfile.id;
		await store.remove([
			this._getTwitchChannelEmotesKey(userId),
			this._getSevenTvChannelEmotesKey(userId),
			this._getFfzChannelEmotesKey(userId),
			this._getBttvChannelEmotesKey(userId)
		]);
	}

	public static async getGlobalEmotesState(): Promise<GlobalEmotesState | null> {
		const data = await store.get(StoreKeys.GlobalEmotesState);
		return data[StoreKeys.GlobalEmotesState] ?? null;
	}

	public static async updateTwitchGlobalEmotesState(newState: Partial<GlobalEmotesState>): Promise<void> {
		const state = await this.getGlobalEmotesState();
		await store.set({ [StoreKeys.GlobalEmotesState]: { ...state, ...newState } });
	}

	public static async getGlobalEmotes(): Promise<Emote[]> {
		const data = (await store.get([
			StoreKeys.TwitchGlobalEmotes,
			StoreKeys.SevenTvGlobalEmotes,
			StoreKeys.FfzGlobalEmotes,
			StoreKeys.BttvGlobalEmotes
		])) as Partial<Record<string, EmoteData[]>>;

		const result: Emote[] = [];

		// The order in which emotes are inserted does matter.
		// It represents the priority of displaying the emotes.
		// The last ones have the highest priority.

		data[StoreKeys.BttvGlobalEmotes]?.forEach(emote => {
			result.push(new BttvEmote(emote));
		});

		data[StoreKeys.FfzGlobalEmotes]?.forEach(emote => {
			result.push(new FfzEmote(emote));
		});

		data[StoreKeys.SevenTvGlobalEmotes]?.forEach(emote => {
			result.push(new StvEmote(emote));
		});

		data[StoreKeys.TwitchGlobalEmotes]?.forEach(emote => {
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
			StoreKeys.TwitchGlobalEmotes,
			StoreKeys.SevenTvGlobalEmotes,
			StoreKeys.FfzGlobalEmotes,
			StoreKeys.BttvGlobalEmotes
		])) as Partial<Record<string, EmoteData[]>>;

		return new Map<ThirdPartyEmoteProvider, Map<string, Emote>>([
			[
				'twitch',
				new Map<string, Emote>(
					data[StoreKeys.TwitchGlobalEmotes]?.map(emote => [emote.id, new TwitchEmote(emote)]) ?? []
				)
			],
			[
				'7tv',
				new Map<string, Emote>(
					data[StoreKeys.SevenTvGlobalEmotes]?.map(emote => [emote.id, new StvEmote(emote)]) ?? []
				)
			],
			[
				'ffz',
				new Map<string, Emote>(
					data[StoreKeys.FfzGlobalEmotes]?.map(emote => [emote.id, new FfzEmote(emote)]) ?? []
				)
			],
			[
				'bttv',
				new Map<string, Emote>(
					data[StoreKeys.BttvGlobalEmotes]?.map(emote => [emote.id, new BttvEmote(emote)]) ?? []
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
		const data = (await store.get(StoreKeys.TwitchGlobalEmotes)) as Partial<Record<string, TwitchEmoteData[]>>;
		return data[StoreKeys.TwitchGlobalEmotes] ?? [];
	}

	public static async setTwitchGlobalEmotes(emotes: TwitchEmote[]): Promise<void> {
		await store.set({ [StoreKeys.TwitchGlobalEmotes]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getSevenTvGlobalEmotes(): Promise<SevenTvEmoteData[]> {
		const data = (await store.get(StoreKeys.SevenTvGlobalEmotes)) as Partial<Record<string, SevenTvEmoteData[]>>;
		return data[StoreKeys.SevenTvGlobalEmotes] ?? [];
	}

	public static async setSevenTvGlobalEmotes(emotes: StvEmote[]): Promise<void> {
		await store.set({ [StoreKeys.SevenTvGlobalEmotes]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getFfzGlobalEmotes(): Promise<FfzEmoteData[]> {
		const data = (await store.get(StoreKeys.FfzGlobalEmotes)) as Partial<Record<string, FfzEmoteData[]>>;
		return data[StoreKeys.FfzGlobalEmotes] ?? [];
	}

	public static async setFfzGlobalEmotes(emotes: FfzEmote[]): Promise<void> {
		await store.set({ [StoreKeys.FfzGlobalEmotes]: emotes.map(emote => emote.toJSON()) });
	}

	public static async getBttvGlobalEmotes(): Promise<BttvEmoteData[]> {
		const data = (await store.get(StoreKeys.BttvGlobalEmotes)) as Partial<Record<string, BttvEmoteData[]>>;
		return data[StoreKeys.FfzGlobalEmotes] ?? [];
	}

	public static async setBttvGlobalEmotes(emotes: BttvEmote[]): Promise<void> {
		await store.set({ [StoreKeys.BttvGlobalEmotes]: emotes.map(emote => emote.toJSON()) });
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
		const data = await store.get(StoreKeys.EmotePickerState);
		return data[StoreKeys.EmotePickerState] ?? defaultEmotePickerState;
	}

	public static async setEmotePickerState(newState: EmotePickerState): Promise<void> {
		const state = await this.getEmotePickerState();
		await store.set({ [StoreKeys.EmotePickerState]: { ...state, ...newState } });
	}

	private static async _setUsers(users: User[]): Promise<void> {
		await store.set({ [StoreKeys.Users]: users });
	}

	private static _getTwitchChannelEmotesKey(userId: string): string {
		return `${StoreKeys.TwitchChannelEmotesPrefix}${userId}}`;
	}

	private static _getSevenTvChannelEmotesKey(userId: string): string {
		return `${StoreKeys.SevenTvChannelEmotesPrefix}${userId}}`;
	}

	private static _getFfzChannelEmotesKey(userId: string): string {
		return `${StoreKeys.FfzChannelEmotesPrefix}${userId}}`;
	}

	private static _getBttvChannelEmotesKey(userId: string): string {
		return `${StoreKeys.BttvChannelEmotesPrefix}${userId}}`;
	}
}
