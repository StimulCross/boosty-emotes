import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		benchmark: {
			include: ['**/*.bench.ts', '**/*.benchmark.ts'],
			reporters: ['default'],
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
})
