import type { EmoteProvider, EmoteScope, EmoteSize, EmoteType } from '@shared/types'
import type { EmoteTooltipEmoteData } from './emote-tooltip.template.ts'
import { boostyEmotesMap } from '@shared/models'
import {
	BOOSTY_EMOTE_SIZES,
	BTTV_EMOTE_SIZES,
	FFZ_EMOTE_SIZES,
	StvEmoteSizes,
	TWITCH_EMOTE_SIZES,
} from '@shared/types'
import { createAppLogger, getEmoteUrl } from '@shared/utils'
import { FloatingManager } from '../floating-manager.ts'
import { renderEmoteTooltip } from './emote-tooltip.template.ts'

const EMOTE_PROVIDER_URL_MAP: Record<EmoteProvider, readonly EmoteSize[]> = {
	boosty: BOOSTY_EMOTE_SIZES,
	twitch: TWITCH_EMOTE_SIZES,
	stv: StvEmoteSizes,
	ffz: FFZ_EMOTE_SIZES,
	bttv: BTTV_EMOTE_SIZES,
}

interface TooltipData {
	target: HTMLElement
	baseImg: HTMLImageElement
	emoteData: EmoteTooltipEmoteData
	modifiers: EmoteTooltipEmoteData[]
}

export class EmoteTooltipManager extends FloatingManager {
	private _showTimeout: ReturnType<typeof setTimeout> | null = null
	private _currentTooltipData: TooltipData | null = null
	private readonly _observer: MutationObserver

	protected override readonly _logger = createAppLogger('EmoteTooltipManager')

	constructor(
		private readonly _rootContainer: HTMLElement,
		private readonly _themeStyles: string,
	) {
		super()

		this._bindEvents()

		this._observer = new MutationObserver(() => {
			if (this._currentTooltipData && !this._currentTooltipData.target.isConnected) {
				this._currentTooltipData = null
				this._clearShowTimeout()
				this._hide()
			}
		})

		this._observer.observe(this._rootContainer, { childList: true, subtree: true })
	}

	public override destroy(): void {
		super.destroy()

		this._unbindEvents()
		this._clearShowTimeout()

		this._observer.disconnect()
	}

	public async updateTooltipEmoteData(data: Partial<EmoteTooltipEmoteData>): Promise<void> {
		if (!this._currentTooltipData)
			return

		this._currentTooltipData.emoteData = { ...this._currentTooltipData.emoteData, ...data }
		await this._renderTooltip(this._currentTooltipData)
	}

	private _bindEvents(): void {
		this._rootContainer.addEventListener('mouseover', this._onMouseOver)
		this._rootContainer.addEventListener('mouseout', this._onMouseOut)
	}

	private _unbindEvents(): void {
		this._rootContainer.removeEventListener('mouseover', this._onMouseOver)
		this._rootContainer.removeEventListener('mouseout', this._onMouseOut)
	}

	private _getTooltipData(target: HTMLElement): TooltipData | null {
		if (target instanceof HTMLImageElement && target.dataset.type === 'smile' && target.dataset.id) {
			const boostyEmote = boostyEmotesMap.get(target.dataset.id)

			if (!boostyEmote)
				return null

			return {
				target,
				baseImg: target,
				emoteData: {
					provider: 'boosty',
					id: boostyEmote.id,
					name: boostyEmote.name,
					type: 'emote',
					scope: 'global',
					isFavorite: false,
				},
				modifiers: [],
			}
		}

		const emoteBox = target.closest<HTMLElement>('button[data-type][data-provider][data-id]')

		if (emoteBox) {
			const images = emoteBox.querySelectorAll<HTMLImageElement>('img')
			let baseImg: HTMLImageElement | undefined
			const modifiers: EmoteTooltipEmoteData[] = []

			if (images.length === 1) {
				baseImg = images[0]
			}
			else {
				for (const img of images) {
					const type = img.dataset.type as EmoteType | undefined

					if (!type)
						continue

					if (type === 'emote') {
						baseImg = img
					}
					else {
						const emoteData = this._extractEmoteDataFromDataset(img)

						if (!emoteData)
							continue

						modifiers.push(emoteData)
					}
				}
			}

			if (!baseImg)
				return null

			const emoteData = this._extractEmoteDataFromDataset(emoteBox)

			if (!emoteData)
				return null

			return {
				target: emoteBox,
				baseImg,
				emoteData,
				modifiers,
			}
		}

		const emoteEl = target.closest<HTMLElement>('[data-tooltip-target="emote"]')

		if (!emoteEl)
			return null

		const emoteData = this._extractEmoteDataFromDataset(emoteEl)

		if (!emoteData)
			return null

		const baseImg
			= emoteEl.tagName === 'IMG' ? (target as HTMLImageElement) : target.querySelector<HTMLImageElement>('img')

		if (!baseImg)
			return null

		return {
			target: emoteEl,
			baseImg,
			emoteData,
			modifiers: [],
		}
	}

	private _extractEmoteDataFromDataset(el: HTMLElement): EmoteTooltipEmoteData | null {
		const { type, provider, id, scope, name, isFavorite } = el.dataset

		if (!provider || !id || !name)
			return null

		return {
			provider: provider as EmoteProvider,
			id,
			name,
			type: type as EmoteType | undefined,
			scope: scope as EmoteScope | undefined,
			isFavorite: isFavorite === 'true',
		}
	}

	private async _renderTooltip({ target, baseImg, emoteData, modifiers }: TooltipData): Promise<void> {
		try {
			const width = baseImg.width
			const height = baseImg.height

			const initialUrl = baseImg.src
			const srcset = this._getTooltipEmoteSrcset(emoteData.provider, emoteData.id, width, height)

			const modifiersWithUrls = modifiers.map(m => ({
				name: m.name,
				url: getEmoteUrl(m.provider, m.id),
			}))

			this._floatingNode.innerHTML = renderEmoteTooltip(
				{
					url: initialUrl,
					emoteData,
					width: `${width * 3}`,
					height: `${height * 3}`,
					modifiers: modifiersWithUrls,
				},
				this._themeStyles,
			)

			const tooltipImg = this._floatingNode.querySelector('img')

			// First we want to show the small cached image while a larger version is loading.
			// Browsers make some optimizations and won't show the cached image while another
			// version from srcset is loading.
			// That's why we set srcset attribute here after creating a tooltip element with a cached smaller img.
			if (tooltipImg)
				tooltipImg.srcset = srcset

			await this._updatePosition(target, 'top')
			this._show()
		}
		catch (err) {
			this._logger.error('Failed to render a tooltip', err)
		}
	}

	private readonly _onMouseOver = (evt: MouseEvent): void => {
		if (!(evt.target instanceof HTMLElement))
			return

		const tooltipData = this._getTooltipData(evt.target)

		if (!tooltipData)
			return

		if (this._currentTooltipData?.target === tooltipData.target)
			return

		this._currentTooltipData = tooltipData
		this._clearShowTimeout()

		this._showTimeout = setTimeout(() => {
			void this._renderTooltip(tooltipData)
		}, 300)
	}

	private readonly _onMouseOut = (evt: MouseEvent): void => {
		if (!(evt.target instanceof HTMLElement))
			return

		const tooltipData = this._getTooltipData(evt.target)

		if (!tooltipData)
			return

		this._currentTooltipData = null
		this._clearShowTimeout()
		this._hide()
	}

	private _getTooltipEmoteSrcset(provider: EmoteProvider, id: string, width: number, height: number): string {
		return EMOTE_PROVIDER_URL_MAP[provider]
			.map(
				size => `${getEmoteUrl(provider, id, size)} ${width * size}w ${height * size}h`,
				// `${EMOTE_PROVIDER_URL_MAP[provider].getUrlFn.call(null, id, size)} ${size}x`,
			)
			.join(', ')
	}

	private _clearShowTimeout(): void {
		if (this._showTimeout) {
			clearTimeout(this._showTimeout)
			this._showTimeout = null
		}
	}
}
