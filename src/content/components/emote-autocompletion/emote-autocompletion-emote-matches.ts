import type { Logger } from '@stimulcross/logger';
import { type EmoteAutocompletionEmoteMatch } from '@content/components/emote-autocompletion/emote-autocompletion-emote-match';
import { DomListener } from '@shared/dom-listener';
import type { EventEmitter } from '@shared/event-emitter';

export class EmoteAutocompletionEmoteMatches extends DomListener {
	private _emoteMatches: EmoteAutocompletionEmoteMatch[] = [];

	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		emoteMatches: EmoteAutocompletionEmoteMatch[]
	) {
		super($root, { emitter });

		this.$root.classList.add('BE-emote-autocompletion__emote-matches');
		this.update(emoteMatches);
		this.initDomListeners();
	}

	public destroy(): void {
		this._destroyEmoteMatches();
		this.removeDomListeners();
	}

	public selectNext(): void {
		this._select('next');
	}

	public selectPrev(): void {
		this._select('prev');
	}

	public update(emoteMatches: EmoteAutocompletionEmoteMatch[]): void {
		this._destroyEmoteMatches();

		this._emoteMatches = emoteMatches;
		this._emoteMatches.forEach(emoteMatch => this.$root.append(emoteMatch.root));

		if (this._emoteMatches.length > 0) {
			this._emoteMatches[0].select();
		}
	}

	public completeCurrentEmote(): void {
		const currentEmoteMatch = this._getCurrentEmoteMatch();

		if (!currentEmoteMatch) {
			return;
		}

		currentEmoteMatch.completeEmote();
	}

	private _destroyEmoteMatches(): void {
		this._emoteMatches.forEach(emoteMatch => emoteMatch.destroy());
	}

	private _getCurrentEmoteMatch(): EmoteAutocompletionEmoteMatch | undefined {
		return this._emoteMatches.find(emoteMatch => emoteMatch.isSelected);
	}

	private _select(type: 'next' | 'prev'): void {
		const currentEmoteMatch = this._getCurrentEmoteMatch();

		if (!currentEmoteMatch) {
			return;
		}

		const currentIndex = this._emoteMatches.findIndex(emoteMatch => emoteMatch === currentEmoteMatch);
		this._emoteMatches[currentIndex].unselect();

		let newEmoteMatch: EmoteAutocompletionEmoteMatch;

		if (type === 'next') {
			if (currentIndex === this._emoteMatches.length - 1) {
				newEmoteMatch = this._emoteMatches[0];
			} else {
				newEmoteMatch = this._emoteMatches[currentIndex + 1];
			}
		} else {
			// eslint-disable-next-line no-lonely-if
			if (currentIndex === 0) {
				newEmoteMatch = this._emoteMatches[this._emoteMatches.length - 1];
			} else {
				newEmoteMatch = this._emoteMatches[currentIndex - 1];
			}
		}

		newEmoteMatch.select();
	}
}
