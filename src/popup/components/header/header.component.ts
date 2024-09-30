import { HeaderNavigationComponent, HeaderUserIdentityComponent } from '@popup/components/header/index';
import { type EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { EVENTS } from '../../constants';
import { Component } from '../component';

export class HeaderComponent extends Component {
	public static readonly className = 'header';
	public readonly name = HeaderComponent.name;
	private readonly _userIdentityComponent: HeaderUserIdentityComponent;
	private readonly _navigationComponent: HeaderNavigationComponent;

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { emitter });

		this._emitter.on(EVENTS.LOGIN, () => {
			this._show();
		});

		this._emitter.on(EVENTS.LOGOUT, () => {
			this._hide();
		});

		this._userIdentityComponent = new HeaderUserIdentityComponent(emitter);
		this.$root.append(this._userIdentityComponent.root);

		this._navigationComponent = new HeaderNavigationComponent(emitter);
		this.$root.append(this._navigationComponent.root);
	}

	public async init(): Promise<void> {
		await super.init();

		await this._userIdentityComponent.init();
		await this._navigationComponent.init();

		const identity = await Store.getIdentity();

		if (identity) {
			this._show();
			this._userIdentityComponent.setIdentity(identity);
		} else {
			this._hide();
		}
	}

	public async destroy(): Promise<void> {
		await super.destroy();

		await this._userIdentityComponent.destroy();
		await this._navigationComponent.destroy();
	}

	private _show(): void {
		this.$root.classList.add('header--show');
	}

	private _hide(): void {
		this.$root.classList.remove('header--show');
	}
}
