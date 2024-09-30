const baseStyleConfig = require('@stimulcross/eslint-config-typescript/style');
const baseNamingConvention = baseStyleConfig.rules['@typescript-eslint/naming-convention'];

const namingConvention = [...baseNamingConvention].map(rule => {
	if (typeof rule === 'object') {
		if (rule.selector === 'default' && !rule.modifiers) {
			return {
				selector: 'default',
				format: ['UPPER_CASE', 'camelCase', 'snake_case'],
				leadingUnderscore: 'allow',
				trailingUnderscore: 'allow'
			};
		}

		if (rule.selector === 'memberLike' && !rule.modifiers) {
			return {
				selector: 'memberLike',
				format: ['UPPER_CASE', 'camelCase', 'snake_case'],
				leadingUnderscore: 'allow',
				trailingUnderscore: 'allow'
			};
		}

		if (rule.selector === 'variable' && !rule.modifiers) {
			return {
				selector: 'variable',
				format: ['UPPER_CASE', 'camelCase', 'snake_case'],
				leadingUnderscore: 'allow',
				trailingUnderscore: 'allow'
			};
		}
	}

	return rule;
});

module.exports = {
	extends: ['@stimulcross/eslint-config-typescript', '@stimulcross/eslint-config-typescript/style'],
	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
		ecmaVersion: 'latest'
	},

	root: true,
	ignorePatterns: ['.eslintrc.cjs'],
	rules: {
		'no-await-in-loop': 'off',
		'import/no-unused-modules': 'off',
		'@typescript-eslint/explicit-member-accessibility': 'off',
		// '@typescript-eslint/no-explicit-any': 'off',
		// '@typescript-eslint/unified-signatures': 'off',
		'@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
		'@typescript-eslint/naming-convention': namingConvention,
		// '@typescript-eslint/member-ordering': 'off',
		'@typescript-eslint/class-literal-property-style': 'off',
		'@typescript-eslint/no-extraneous-class': 'off'
	}
};
