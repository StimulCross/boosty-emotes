/* eslint-disable ts/prefer-literal-enum-member */

import styles from './ffz-effects.module.css'

export const FFZ_EFFECT_CLASS = styles.ffzEffect

export enum FfzFlag {
	// eslint-disable-next-line unicorn/prefer-math-trunc
	Hidden = 1 << 0,
	FlipX = 1 << 1,
	FlipY = 1 << 2,
	GrowX = 1 << 3,
	Slide = 1 << 4,
	Appear = 1 << 5,
	Leave = 1 << 6,
	Rotate = 1 << 7,
	Rotate90 = 1 << 8,
	Greyscale = 1 << 9,
	Sepia = 1 << 10,
	Rainbow = 1 << 11,
	HyperRed = 1 << 12,
	Shake = 1 << 13,
	Cursed = 1 << 14,
	Jam = 1 << 15,
	Bounce = 1 << 16,
	NoSpace = 1 << 17,

	None = 0,
	All = (1 << 18) - 1,
}

export interface FfzEffect {
	name: string
	cssClass: string
	type: 'transform' | 'filter' | 'animation'
}

export type FfzEffectDef = Omit<FfzEffect, 'name'>

export const FFZ_EFFECT_MAP = new Map<FfzFlag, FfzEffectDef>([
	[FfzFlag.FlipX, { cssClass: styles.ffzFlipX, type: 'transform' }],
	[FfzFlag.FlipY, { cssClass: styles.ffzFlipY, type: 'transform' }],
	[FfzFlag.GrowX, { cssClass: styles.ffzGrowX, type: 'transform' }],
	[FfzFlag.Rotate90, { cssClass: styles.ffzRotate90, type: 'transform' }],
	[FfzFlag.Greyscale, { cssClass: styles.ffzGreyscale, type: 'filter' }],
	[FfzFlag.Sepia, { cssClass: styles.ffzSepia, type: 'filter' }],
	[FfzFlag.HyperRed, { cssClass: styles.ffzHyperRed, type: 'filter' }],
	[FfzFlag.Cursed, { cssClass: styles.ffzCursed, type: 'filter' }],
	[FfzFlag.Rainbow, { cssClass: styles.ffzRainbow, type: 'animation' }],
	[FfzFlag.Rotate, { cssClass: styles.ffzRotate, type: 'animation' }],
	[FfzFlag.Slide, { cssClass: styles.ffzSlide, type: 'animation' }],
	[FfzFlag.Appear, { cssClass: styles.ffzAppear, type: 'animation' }],
	[FfzFlag.Leave, { cssClass: styles.ffzLeave, type: 'animation' }],
	[FfzFlag.Shake, { cssClass: styles.ffzShake, type: 'animation' }],
	[FfzFlag.Jam, { cssClass: styles.ffzJam, type: 'animation' }],
	[FfzFlag.Bounce, { cssClass: styles.ffzBounce, type: 'animation' }],
])

export function parseFfzFlags(flags: number | undefined): FfzEffect[] {
	if (!flags)
		return []

	const result: FfzEffect[] = []

	for (const [flag, def] of FFZ_EFFECT_MAP) {
		if (flags & flag) {
			result.push({ name: FfzFlag[flag], ...def })
		}
	}

	return result
}
