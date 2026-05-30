import { View } from '@shared/ui/view.ts'
import animationStyles from '../../shared/styles/animations.module.css'
import scrollStyles from '../../shared/styles/scroll-container-y.module.css'
import styles from './home.module.css'
import { renderHome } from './home.template.ts'

export interface HomePageLayoutViewProps {
	onFabClick: () => void
}

export class HomeView extends View<HomePageLayoutViewProps> {
	private _alertsContainer!: HTMLElement
	private _userListContainer!: HTMLElement
	private _fabButton!: HTMLButtonElement

	constructor(props: HomePageLayoutViewProps) {
		super('div', props, [styles.root, scrollStyles.scrollContainerY, animationStyles.contentFadeIn])
		this._initTemplate()
	}

	public get alertsSlot(): HTMLElement {
		return this._alertsContainer
	}

	public get userListSlot(): HTMLElement {
		return this._userListContainer
	}

	protected override _bindEvents(): void {
		this._fabButton.addEventListener('click', this._onFabClick)
	}

	protected override _unbindEvents(): void {
		this._fabButton.removeEventListener('click', this._onFabClick)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderHome()

		const fabButton = this.$root.querySelector<HTMLButtonElement>('[data-action="add_user"]')
		const alertsContainer = this.$root.querySelector<HTMLElement>('[data-slot="alerts"]')
		const userListContainer = this.$root.querySelector<HTMLElement>('[data-slot="user-list"]')

		if (!fabButton || !alertsContainer || !userListContainer)
			throw new Error('Home template is invalid')

		this._fabButton = fabButton
		this._alertsContainer = alertsContainer
		this._userListContainer = userListContainer
	}

	private readonly _onFabClick = (): void => {
		this._props.onFabClick()
	}
}
