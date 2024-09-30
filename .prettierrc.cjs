/// <reference types="prettier-plugin-embed/plugin-embed" />

module.exports = {
	...require('@stimulcross/prettier-config'),
	embeddedLanguageFormatting: 'auto',
	plugins: [
		'prettier-plugin-embed'
		// 'prettier-plugin-css-order'
	]
};
