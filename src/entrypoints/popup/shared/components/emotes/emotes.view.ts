import type { EmoteViewModel } from '@shared/models/emotes/emote.view-model.ts'
import type { ThirdPartyEmoteProvider } from '@shared/types'
import type { EmoteTab } from './constants.ts'
import { View } from '@shared/ui'
import { html } from 'code-tag'
import { Formatter } from '../../utils/formatter.ts'
import { EMOTE_TABS } from './constants.ts'
import { renderEmoteSet } from './emote-set.template.ts'
import { renderEmoteTabs } from './emote-tabs.template.ts'
import styles from './emotes.module.css'
import { renderEmotes } from './emotes.template.ts'

export interface EmoteListProps {
	onSearch: (query: string) => void
	onTabSelect: (tab: EmoteTab) => void
	onEmoteClick: (
		provider: ThirdPartyEmoteProvider,
		id: string,
		isCtrl: boolean,
		btn: HTMLButtonElement,
	) => Promise<void>
}

export interface EmoteListState {
	searchQuery: string
	activeTab: EmoteTab
	visibleTabs: EmoteTab[]
	currentEmotes: EmoteViewModel[]
	stats: { total: number, updatedAt: number } | null
}

export class EmotesView extends View<EmoteListProps> {
	private _searchInput!: HTMLInputElement
	private _tabsContainer!: HTMLElement
	private _contentContainer!: HTMLElement
	private readonly _tabs: Map<EmoteTab, HTMLElement> = new Map()

	constructor(props: EmoteListProps) {
		super('div', props, styles.root)
		this._initTemplate()
	}

	public render(state: EmoteListState): void {
		if (this._searchInput.value !== state.searchQuery)
			this._searchInput.value = state.searchQuery

		let currentTab: EmoteTab | undefined

		for (const [tabName, node] of this._tabs.entries()) {
			if (node.classList.contains(styles.tabActive)) {
				currentTab = tabName

				break
			}
		}

		this.renderTabs(state.visibleTabs, state.activeTab)

		if (currentTab !== state.activeTab) {
			this._contentContainer.innerHTML = state.stats
				? renderEmoteSet(
						state.activeTab,
						state.currentEmotes,
						state.stats.total,
						new Date(state.stats.updatedAt),
					)
				: html`
				<div>${browser.i18n.getMessage('emote_set_empty')}</div>`
		}

		this.filterEmotes(state.searchQuery)
	}

	public renderTabs(visibleTabs: EmoteTab[], activeTab: EmoteTab): void {
		for (const [tabName, node] of this._tabs.entries()) {
			const isVisible = visibleTabs.includes(tabName)
			const isActive = tabName === activeTab

			node.classList.toggle(styles.tabHidden, !isVisible)
			node.classList.toggle(styles.tabActive, isActive)
		}
	}

	public filterEmotes(query: string): void {
		const lowerQuery = query.toLowerCase()
		const items = this._contentContainer.querySelectorAll<HTMLButtonElement>('li[data-name]')
		let visibleCount = 0

		for (const item of items) {
			const name = item.dataset.name

			if (!lowerQuery || name?.includes(lowerQuery)) {
				item.classList.remove(styles.emoteHidden)
				visibleCount += 1
			}
			else {
				item.classList.add(styles.emoteHidden)
			}
		}

		const countSlot = this.$root.querySelector<HTMLElement>('[data-slot="total-emotes"]')

		countSlot && (countSlot.textContent = Formatter.formatNumber(visibleCount))
	}

	public toggleFavorite(provider: string, id: string, isFavorite: boolean): void {
		const btn = this._contentContainer.querySelector(`button[data-id="${id}"][data-provider="${provider}"]`)

		if (!btn)
			return

		if (isFavorite)
			btn.classList.add(styles.favoriteEmote)

		else
			btn.classList.remove(styles.favoriteEmote)
	}

	public removeEmoteNode(id: string, provider: string): void {
		const btn = this._contentContainer.querySelector(`button[data-id="${id}"][data-provider="${provider}"]`)

		btn?.parentElement?.remove()
	}

	protected override _bindEvents(): void {
		this._searchInput.addEventListener('input', this._onInput)
		this._tabsContainer.addEventListener('click', this._onTabClick)
		this._contentContainer.addEventListener('click', this._onEmoteClick)
	}

	protected override _unbindEvents(): void {
		this._searchInput.removeEventListener('input', this._onInput)
		this._tabsContainer.removeEventListener('click', this._onTabClick)
		this._contentContainer.removeEventListener('click', this._onEmoteClick)
	}

	private readonly _onInput = (evt: Event): void => {
		if (!evt.target || !(evt.target instanceof HTMLInputElement))
			return

		const query = evt.target.value.replaceAll(/\s+/gu, '')

		this._props.onSearch(query)
	}

	private readonly _onTabClick = (evt: MouseEvent): void => {
		if (!evt.target || !(evt.target instanceof Element))
			return

		const tab = evt.target.closest<HTMLElement>(`.${styles.tab}`)

		if (tab)
			this._props.onTabSelect(tab.dataset.tab as EmoteTab)
	}

	private readonly _onEmoteClick = (evt: MouseEvent): void => {
		if (!evt.target || !(evt.target instanceof Element))
			return

		const emoteBtn = evt.target.closest<HTMLButtonElement>('button[data-action-type="emote-button"]')

		if (!emoteBtn)
			return

		const provider = emoteBtn.dataset.provider as ThirdPartyEmoteProvider
		const id = emoteBtn.dataset.id ?? ''
		const isCtrl = evt.ctrlKey || evt.altKey

		void this._props.onEmoteClick(provider, id, isCtrl, emoteBtn)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderEmotes()

		const tabsContainer = this.$root.querySelector<HTMLElement>(`.${styles.tabs}`)
		const searchInput = this.$root.querySelector<HTMLInputElement>(`.${styles.searchInput}`)
		const contentContainer = this.$root.querySelector<HTMLElement>(`.${styles.body}`)

		if (!tabsContainer || !searchInput || !contentContainer)
			throw new Error('Emotes view template is invalid')

		this._tabsContainer = tabsContainer

		this._tabsContainer.innerHTML = EMOTE_TABS.map(tab => renderEmoteTabs(tab, false, false)).join('')

		for (const tab of EMOTE_TABS) {
			const node = this._tabsContainer.querySelector<HTMLElement>(`[data-tab="${tab}"]`)

			if (node)
				this._tabs.set(tab, node)
		}

		this._searchInput = searchInput
		this._contentContainer = contentContainer
	}
}
