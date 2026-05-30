import path from 'node:path'
import { env } from 'node:process'
import { defineConfig } from 'wxt'
import 'dotenv/config'

export default defineConfig({
	srcDir: 'src',
	outDir: 'dist',
	manifestVersion: 3,
	manifest: ({ browser }) => ({
		name: 'Boosty Emotes',
		description: '__MSG_description__',
		homepage_url: 'https://github.com/StimulCross/boosty-emotes',
		permissions: ['storage', 'unlimitedStorage', 'identity', 'alarms'],
		minimum_chrome_version: '120',
		default_locale: 'en',
		host_permissions: ['https://*.boosty.to/*'],
		icons: {
			16: 'icon/icon-16.png',
			32: 'icon/icon-32.png',
			48: 'icon/icon-48.png',
			128: 'icon/icon-128.png',
		},
		...(
			browser === 'firefox'
				? {
						browser_specific_settings: {
							gecko: {
								id: 'boosty-emotes@stimulcross.github.io',
								strict_min_version: '115.0',
								data_collection_permissions: {
									required: ['none'],
								},
							},
						},
					}
				: { key: env.WXT_CHROMIUM_EXTENSION_KEY }
		),
	}),
	webExt: {
		disabled: true,
	},
	vite: () => ({
		resolve: {
			alias: {
				'@shared': path.resolve(__dirname, './src/shared'),
			},
		},
		css: {
			modules: {
				generateScopedName: '[name]_[local]_[hash:base64:5]',
			},
		},
	}),
})
