import { smileIconSvg } from '../assets/svg';

export function createEmotePickerButton(): HTMLButtonElement {
	const button = document.createElement('button');
	button.classList.add('BE-emote-picker__button');
	button.type = 'button';
	button.innerHTML = smileIconSvg;

	return button;
}
