import { type RedactorsState } from '@content/components';
import { type CaretPosition } from '@content/types';
import { endsWithWhiteSpace, restoreCaretPosition, startsWithWhiteSpace } from '@content/utils';
import { checkIsTextNode } from '@shared/utils/check-is-text-node';

export class EmoteInserter {
	private readonly _redactor: HTMLElement;

	constructor(
		private readonly $publisher: HTMLElement,
		private readonly _redactorsState: RedactorsState
	) {
		const redactor = this.$publisher.querySelector('.codex-editor__redactor');

		if (!(redactor instanceof HTMLElement)) {
			throw new Error('Redactor not found');
		}

		this._redactor = redactor;
	}

	public insertEmote(emote: string | HTMLElement): void {
		const caretPosition = this._redactorsState.get(this._redactor);

		if (caretPosition) {
			this.insertEmoteToCaret(emote, caretPosition);
		} else {
			this.insertEmoteToEnd(emote);
		}
	}

	public insertEmoteToCaret(emote: string | HTMLElement, caretPosition: CaretPosition): void {
		if (this._redactor.childNodes.length > 0) {
			const block = this._redactor.children[caretPosition.blockIndex];

			if (!(block instanceof HTMLElement)) {
				throw new Error('No text block found');
			}

			const blockContent = block.querySelector('.cdx-block');

			if (!(blockContent instanceof HTMLElement)) {
				throw new Error('No block content inside block found');
			}

			if (blockContent.childNodes.length > 0) {
				const item =
					(blockContent.childNodes[caretPosition.itemIndex] as Node | null) ?? blockContent.lastChild;

				if (item instanceof Element || item instanceof Text) {
					this._insertEmoteToBlockItem(item, emote, caretPosition);
				} else {
					this._insertEmoteToBlockContentEnd(blockContent, emote, caretPosition);
				}
			} else {
				this._insertEmoteToBlockContentEnd(blockContent, emote, caretPosition);
			}

			const blockToFocus = block.querySelector('.cdx-block');

			if (blockToFocus instanceof HTMLElement) {
				this._focusBlock(blockToFocus, caretPosition);
			}
		} else {
			this.insertEmoteToEnd(emote);
		}
	}

	public insertEmoteToEnd(emote: string | HTMLElement): void {
		if (this._redactor.childNodes.length > 0) {
			const block = this._redactor.lastElementChild?.children[0].lastElementChild;

			if (!(block instanceof HTMLElement)) {
				throw new Error('No text block found');
			}

			if (typeof emote !== 'string') {
				block.append(emote);
			} else if (block.lastChild?.nodeType === Node.TEXT_NODE) {
				block.lastChild.textContent += ` ${emote} `;
			} else {
				block.append(` ${emote} `);
			}

			const caretPosition = this._redactorsState.get(this._redactor);

			if (caretPosition) {
				caretPosition.blockIndex = this._redactor.childNodes.length - 1;

				const item = this._redactor.lastElementChild?.firstElementChild?.firstElementChild;
				caretPosition.itemIndex = item ? item.childNodes.length - 1 : 0;
				caretPosition.offset = item instanceof Text ? (item.textContent?.length ?? 0) : 0;
			}

			const blockToFocus = block.querySelector('.cdx-block');

			if (blockToFocus instanceof HTMLElement) {
				this._focusBlock(blockToFocus, caretPosition);
			}
		}
	}

	private _insertEmoteToBlockItem(
		item: Element | Text,
		emote: string | HTMLElement,
		caretPosition: CaretPosition
	): void {
		if (checkIsTextNode(item) && item.textContent) {
			const parts: Array<string | Node> = [];

			if (caretPosition.offset === 0) {
				if (typeof emote === 'string') {
					const emoteText = startsWithWhiteSpace(item.textContent) ? emote : `${emote}\u00a0`;
					parts.push(`${emoteText}${item.textContent}`);
					caretPosition.offset = emoteText.length;
				} else {
					parts.push(emote, item.textContent);
					caretPosition.itemIndex += 1;
				}
			} else if (caretPosition.offset === item.textContent.length) {
				if (typeof emote === 'string') {
					const emoteText = endsWithWhiteSpace(item.textContent) ? `${emote}\u00a0` : `\u00a0${emote}\u00a0`;
					parts.push(`${item.textContent}${emoteText}`);
					caretPosition.offset += emoteText.length;
				} else {
					parts.push(item.textContent, emote);
					caretPosition.itemIndex += 1;
				}
			} else {
				const left = item.textContent.slice(0, caretPosition.offset);
				const right = item.textContent.slice(caretPosition.offset);

				if (typeof emote === 'string') {
					let emoteText = `${emote}`;

					if (!startsWithWhiteSpace(right)) {
						emoteText += '\u00a0';
					}

					if (!endsWithWhiteSpace(left)) {
						emoteText = `\u00a0${emoteText}`;
					}

					parts.push(`${left}${emoteText}${right}`);
					caretPosition.offset += emoteText.length;
				} else {
					parts.push(left, emote, right);
					caretPosition.itemIndex += 1;
				}
			}

			item.replaceWith(...parts);
		} else if (
			typeof emote === 'string' &&
			checkIsTextNode(item.nextSibling) &&
			item.nextSibling.textContent &&
			item.nextSibling.textContent.length > 0
		) {
			const text = startsWithWhiteSpace(item.nextSibling.textContent) ? `${emote}` : `${emote}\u00a0`;
			item.nextSibling.textContent = text + item.nextSibling.textContent;
			caretPosition.itemIndex += 1;
			caretPosition.offset = text.length - 1;
		} else if (typeof emote === 'string') {
			let emoteText = `${emote}`;

			if (
				!item.nextSibling ||
				(checkIsTextNode(item.nextSibling) && !startsWithWhiteSpace(item.nextSibling.textContent!))
			) {
				emoteText += '\u00a0';
			}

			item.after(emoteText);
			caretPosition.itemIndex += 1;
			caretPosition.offset = emoteText.length;
		} else {
			item.after(emote);
			caretPosition.itemIndex += 1;
			caretPosition.offset = 0;
		}

		this._updateRedactorCaretPosition(caretPosition);
	}

	private _insertEmoteToBlockContentEnd(
		blockContent: HTMLElement,
		emote: string | HTMLElement,
		caretPosition: CaretPosition
	): void {
		if (typeof emote === 'string') {
			if (checkIsTextNode(blockContent.lastChild)) {
				const textContent =
					blockContent.lastChild.textContent && blockContent.lastChild.textContent.length > 0
						? ` ${emote} `
						: `${emote}`;
				blockContent.lastChild.textContent = (blockContent.lastChild.textContent ?? '') + textContent;
				caretPosition.itemIndex = blockContent.childNodes.length - 1;
				caretPosition.offset = blockContent.lastChild.textContent.length - 1;
			} else {
				const textContent = `${emote}\u00a0`;
				blockContent.append(textContent);
				caretPosition.itemIndex = blockContent.childNodes.length > 0 ? blockContent.childNodes.length - 1 : 0;
				caretPosition.offset = textContent.length;
			}
		} else {
			blockContent.append(emote);
			blockContent.append('\u00a0');
			caretPosition.itemIndex = blockContent.childNodes.length > 0 ? blockContent.childNodes.length - 1 : 0;
			caretPosition.offset = 1;
		}

		this._updateRedactorCaretPosition(caretPosition);
	}

	private _updateRedactorCaretPosition(caretPosition: CaretPosition): void {
		this._redactorsState.set(this._redactor, caretPosition);
	}

	private _focusBlock(block: HTMLElement, caretPosition?: CaretPosition | null): void {
		// @ts-ignore No error
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		setTimeout(() => {
			block.focus();

			if (caretPosition) {
				restoreCaretPosition(this._redactor, caretPosition);
			}
		});
	}
}
