import { createLogger } from '@stimulcross/logger';
import { EmoteInserter, type RedactorsState } from '@content/components';
import { EMOTE_AUTOCOMPLETION_EVENTS } from '@content/components/emote-autocompletion/constants';
import { type EmoteMatch } from '@content/types/emote-match';
import { type TokenWithIndices } from '@content/types/token-with-indices';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { EmoteAutocompletionMatchType } from '@shared/enums';
import type { EventEmitter } from '@shared/event-emitter';
import type { EmoteAutocompletionSettings } from '@shared/models/emote-autocompletion-settings';
import type { EmoteProvider, ScopesEmotesSets } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmoteAutocompletionEmoteMatch } from './emote-autocompletion-emote-match';
import { EmoteAutocompletionEmoteMatches } from './emote-autocompletion-emote-matches';

export class EmoteAutocompletion {
	private static readonly _logger = createLogger(createLoggerOptions(EmoteAutocompletion.name));
	private _token: TokenWithIndices;
	private readonly _emoteInserter: EmoteInserter;
	private readonly _emoteMatches: EmoteAutocompletionEmoteMatches;
	private readonly _emotesPriority: Record<EmoteProvider, number>;
	private readonly _comparator = new Intl.Collator();

	constructor(
		private readonly $root: HTMLDivElement,
		private readonly _emitter: EventEmitter,
		private readonly $publisher: HTMLElement,
		private readonly _redactorsState: RedactorsState,
		private readonly _emoteSets: ScopesEmotesSets,
		private readonly _favoriteEmotes: FavoriteEmotes,
		token: TokenWithIndices,
		private readonly _emoteAutocompletionSettings: EmoteAutocompletionSettings,
		bottomOffset?: string,
		leftOffset?: string,
		width?: string
	) {
		this.$root.classList.add('BE-emote-autocompletion');

		if (bottomOffset) {
			this.$root.style.bottom = bottomOffset;
		}

		if (leftOffset) {
			this.$root.style.left = leftOffset;
		}

		if (width) {
			this.$root.style.width = width;
		}

		this._emoteInserter = new EmoteInserter(this.$publisher, this._redactorsState);
		this._emotesPriority = Object.fromEntries(
			this._emoteAutocompletionSettings.priority.map((provider, i) => [provider, i])
		) as Record<EmoteProvider, number>;

		this._token = token;
		this._token.value = this._token.value.toLowerCase();

		const matchedEmotes = this._getMatchedEmotes(this._token.value);

		const emoteMatches: EmoteAutocompletionEmoteMatch[] = [];
		matchedEmotes.forEach(emoteMatch =>
			emoteMatches.push(
				new EmoteAutocompletionEmoteMatch(
					document.createElement('button'),
					this._emitter,
					EmoteAutocompletion._logger,
					emoteMatch,
					this._token,
					this._emoteInserter
				)
			)
		);

		this._emoteMatches = new EmoteAutocompletionEmoteMatches(
			document.createElement('div'),
			this._emitter,
			EmoteAutocompletion._logger,
			emoteMatches
		);

		this.$root.append(this._emoteMatches.root);

		if (matchedEmotes.length === 0) {
			return;
		}

		$publisher.append(this.$root);
	}

	public selectNext(): void {
		this._emoteMatches.selectNext();
	}

	public selectPrev(): void {
		this._emoteMatches.selectPrev();
	}

	public update(token: TokenWithIndices): void {
		token.value = token.value.toLowerCase();

		if (this._token.value === token.value) {
			return;
		}

		this._token = token;
		const matchedEmotes = this._getMatchedEmotes(this._token.value);

		if (matchedEmotes.length === 0) {
			this._emitter.emit(EMOTE_AUTOCOMPLETION_EVENTS.noMatches);
		}

		const emoteMatches: EmoteAutocompletionEmoteMatch[] = [];
		matchedEmotes.forEach(emoteMatch =>
			emoteMatches.push(
				new EmoteAutocompletionEmoteMatch(
					document.createElement('button'),
					this._emitter,
					EmoteAutocompletion._logger,
					emoteMatch,
					this._token,
					this._emoteInserter
				)
			)
		);

		this._emoteMatches.update(emoteMatches);
	}

	public destroy(): void {
		this.$root.remove();
		this._emoteMatches.destroy();
	}

	public completeCurrentEmote(): void {
		this._emoteMatches.completeCurrentEmote();
	}

	private _getMatchedEmotes(token: string): EmoteMatch[] {
		const matchedEmotes: EmoteMatch[] = [];

		for (const set of this._emoteSets.values()) {
			for (const providerEmotes of set.values()) {
				for (const emote of providerEmotes.values()) {
					const matchType = emote.matches(token);

					if (matchType === null) {
						continue;
					}

					const isFavorite =
						emote.scope === 'global'
							? this._favoriteEmotes.isGlobalFavorite(emote)
							: this._favoriteEmotes.isChannelFavorite(emote);

					if (this._emoteAutocompletionSettings.matchType === EmoteAutocompletionMatchType.StartsWith) {
						if (matchType === EmoteAutocompletionMatchType.StartsWith) {
							matchedEmotes.push({ emote, matchType, isFavorite });
						}
					} else {
						matchedEmotes.push({ emote, matchType, isFavorite });
					}
				}
			}
		}

		return this._sortMatchedEmotes(matchedEmotes);
	}

	private _sortMatchedEmotes(matchedEmotes: EmoteMatch[]): EmoteMatch[] {
		return matchedEmotes
			.sort((a, b) => {
				if (this._emoteAutocompletionSettings.prioritizeFavoriteEmotes) {
					if (a.isFavorite && b.isFavorite) {
						return this._comparator.compare(a.emote.nameLowerCase, b.emote.nameLowerCase);
					} else if (a.isFavorite) {
						return -1;
					} else if (b.isFavorite) {
						return 1;
					}
				}

				if (this._emoteAutocompletionSettings.prioritizePrefixMatchedEmotes) {
					const isAPrefixMatched = a.matchType === EmoteAutocompletionMatchType.StartsWith;
					const isBPrefixMatched = b.matchType === EmoteAutocompletionMatchType.StartsWith;

					if (isAPrefixMatched && isBPrefixMatched) {
						return this._comparator.compare(a.emote.nameLowerCase, b.emote.nameLowerCase);
					} else if (isAPrefixMatched) {
						return -1;
					} else if (isBPrefixMatched) {
						return 1;
					}
				}

				if (this._emoteAutocompletionSettings.sortByPriority) {
					if (this._emotesPriority[a.emote.provider] < this._emotesPriority[b.emote.provider]) {
						return -1;
					} else if (this._emotesPriority[a.emote.provider] > this._emotesPriority[b.emote.provider]) {
						return 1;
					}
				}

				return this._comparator.compare(a.emote.nameLowerCase, b.emote.nameLowerCase);
			})
			.slice(0, this._emoteAutocompletionSettings.limit);
	}
}
