import { defineConfig } from '@stimulcross/eslint-config'

export default defineConfig({
	pnpm: {
		yaml: false,
	},
	perfectionist: true,
	formatters: {
		markdown: 'dprint',
		html: 'prettier',
		css: 'prettier',
	},
	typescript: {
		tsconfigPath: './tsconfig.json',
		overridesTypeAware: {
			'ts/naming-convention': 'off',
		},
	},
})
