import type { Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { type EmoteInserter } from '@content/components';
import { EMOTE_AUTOCOMPLETION_EVENTS } from '@content/components/emote-autocompletion/constants';
import { type EmoteMatch } from '@content/types/emote-match';
import { type TokenWithIndices } from '@content/types/token-with-indices';
import { boostyIconSvg, bttvIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { createFavoriteIcon } from '@shared/components/favorite-icon/create-favorite-icon';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmoteProvider } from '@shared/types';

export class EmoteAutocompletionEmoteMatch extends DomListener {
	private _isSelected = false;

	constructor(
		$root: HTMLButtonElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _emoteMatch: EmoteMatch,
		private readonly _token: TokenWithIndices,
		private readonly _emoteInserter: EmoteInserter
	) {
		super($root, { emitter, listeners: ['click'] });

		this.$root.classList.add('BE-emote-autocompletion__emote-match');
		this.$root.innerHTML = this._getTemplate();

		this.initDomListeners();
	}

	public get isSelected(): boolean {
		return this._isSelected;
	}

	public destroy(): void {
		this.removeDomListeners();
		this.$root.remove();
	}

	public select(): void {
		this._isSelected = true;
		this.$root.classList.add('BE-emote-autocompletion__emote-match--select');
		this.$root.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
	}

	public unselect(): void {
		this._isSelected = false;
		this.$root.classList.remove('BE-emote-autocompletion__emote-match--select');
	}

	public completeEmote(): void {
		if (this._emoteMatch.emote.provider === 'boosty') {
			const emoteTempContainer = document.createElement('span');
			emoteTempContainer.innerHTML = this._emoteMatch.emote.toHtml();
			this._emoteInserter.replaceTextWithEmote(
				emoteTempContainer.firstElementChild as HTMLImageElement,
				this._token.start,
				this._token.end
			);
		} else {
			this._emoteInserter.replaceTextWithEmote(this._emoteMatch.emote.name, this._token.start, this._token.end);
		}

		this._emitter.emit(EMOTE_AUTOCOMPLETION_EVENTS.emoteComplete);
	}

	private _onClick(): void {
		try {
			this.completeEmote();
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(): string {
		return html`
			<figure class="BE-BE-emote-autocompletion__emote-match-emote-container">
				${this._emoteMatch.emote.toHtml(1, 'BE-emote-autocompletion__emote-match-emote')}
				${this._emoteMatch.isFavorite ? createFavoriteIcon().outerHTML : ''}
			</figure>
			<span class="BE-emote-autocompletion__emote-match-emote-name" title="${this._emoteMatch.emote.name}">
				${this._emoteMatch.emote.name}
			</span>
			<span
				class="BE-emote-autocompletion__emote-match-provider-icon BE-emote-autocompletion__emote-match-provider-icon--${this
					._emoteMatch.emote.provider}"
				>${this._mapProviderToProviderIcon(this._emoteMatch.emote.provider)}</span
			>
		`;
	}

	private _mapProviderToProviderIcon(provider: EmoteProvider): string {
		switch (provider) {
			case 'boosty': {
				return boostyIconSvg;
			}

			case 'twitch': {
				return twitchIconSvg;
			}

			case '7tv': {
				return stvIconSvg;
			}

			case 'ffz': {
				return ffzIconSvg;
			}

			case 'bttv': {
				return bttvIconSvg;
			}

			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}
}
