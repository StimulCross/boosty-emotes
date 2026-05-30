import type { TwitchUser } from '@shared/models'
import { View } from '@shared/ui/view.ts'
import styles from './header.module.css'
import { renderHeader } from './header.template.ts'

export type HeaderMode = 'identity' | 'back'

export interface HeaderViewState {
	mode: HeaderMode
	identity: TwitchUser | null
	isMenuOpened: boolean
	isLoading: boolean
}

export interface HeaderViewProps {
	onBackClick: () => void
	onSettingsClick: () => void
	onGlobalsClick: () => void
	onLogoutClick: () => void
}

export class HeaderView extends View<HeaderViewProps> {
	private _identityContainer!: HTMLElement
	private _backButton!: HTMLElement
	private _menu!: HTMLElement
	private _avatarImg!: HTMLImageElement
	private _username!: HTMLElement

	constructor(props: HeaderViewProps) {
		super('div', props, styles.root)
		this._initTemplate()
	}

	public render(state: HeaderViewState): void {
		this._identityContainer.classList.toggle(styles.userIdentityShow, state.mode === 'identity')
		this._backButton.classList.toggle(styles.backButtonShow, state.mode === 'back')

		if (state.identity) {
			this.$root.classList.add(styles.headerShow)
			this._avatarImg.src = state.identity.avatar
			this._username.textContent = state.identity.displayName
		}

		if (state.isMenuOpened)
			this._menu.classList.add(styles.menuShow)

		else
			this._menu.classList.remove(styles.menuShow)
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._onClick)
		globalThis.addEventListener('click', this._onWindowClick)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._onClick)
		globalThis.removeEventListener('click', this._onWindowClick)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderHeader()

		const backButton = this.$root.querySelector<HTMLElement>(`.${styles.backButton}`)
		const identityContainer = this.$root.querySelector<HTMLElement>(`.${styles.userIdentity}`)
		const menu = this.$root.querySelector<HTMLElement>(`.${styles.menu}`)
		const avatarImg = this.$root.querySelector<HTMLImageElement>(`.${styles.avatar}`)
		const username = this.$root.querySelector<HTMLElement>(`.${styles.username}`)

		if (!backButton || !identityContainer || !menu || !avatarImg || !username) {
			throw new Error('Header template is invalid')
		}

		this._backButton = backButton
		this._identityContainer = identityContainer
		this._menu = menu
		this._avatarImg = avatarImg
		this._username = username
	}

	private readonly _onClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof HTMLElement))
			return

		const backButton = evt.target.closest<HTMLElement>(`.${styles.backButton}`)

		if (backButton) {
			this._props.onBackClick()

			return
		}

		const menuButton = evt.target.closest<HTMLElement>(`.${styles.menuButton}`)

		if (menuButton) {
			const isMenuOpened = this._menu.classList.contains(styles.menuShow)

			if (isMenuOpened)
				this._menu.classList.remove(styles.menuShow)

			else
				this._menu.classList.add(styles.menuShow)

			return
		}

		const menuItem = evt.target.closest<HTMLElement>(`.${styles.menuListItem}`)

		if (menuItem) {
			const action = menuItem.dataset.action

			this._menu.classList.remove(styles.menuShow)

			switch (action) {
				case 'settings':
					this._props.onSettingsClick()

					break

				case 'global_emotes':
					this._props.onGlobalsClick()

					break

				case 'logout':
					this._props.onLogoutClick()

					break

				default:
					break
			}
		}
	}

	private readonly _onWindowClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof HTMLElement))
			return

		if (!evt.target.closest(`.${styles.menu}`) && !evt.target.closest(`.${styles.menuButton}`))
			this._menu.classList.remove(styles.menuShow)
	}
}
