import { html } from 'code-tag';
import { type EventEmitter } from '@shared/event-emitter';
import { Component } from './component';

export class FooterComponent extends Component {
	public static readonly className = 'footer';
	public readonly name = FooterComponent.name;

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { emitter });
	}

	public override init(): void {
		this._update();
	}

	private _update(): void {
		this.$root.innerHTML = html`
			<ul class="footer__social">
				<li class="footer__social-item">
					<a class="footer__social-link" href="https://github.com/StimulCross/boosty-emotes" target="_blank">
						<img class="footer__social-icon" src="images/github-32.png" alt="GitHub" />
						<span class="footer__social-name">GitHub</span></a
					>
				</li>
			</ul>
		`;
	}
}
