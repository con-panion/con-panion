module.exports = {
	printWidth: 120,
	useTabs: true,
	semi: true,
	singleQuote: true,
	quoteProps: 'as-needed',
	trailingComma: 'all',
	bracketSpacing: true,
	arrowParens: 'always',
	proseWrap: 'preserve',
	endOfLine: 'lf',
	plugins: [require.resolve('@ianvs/prettier-plugin-sort-imports'), require.resolve('prettier-plugin-tailwindcss')],
	tailwindFunctions: ['clsx', 'cn', 'twMerge', 'twJoin'],
	importOrder: [
		'<BUILTIN_MODULES>',
		'^(react/(.*)$)|^(react$)',
		'',
		'<THIRD_PARTY_MODULES>',
		'',
		'^#abilities/(.*)$',
		'^#config/(.*)$',
		'^#controllers/(.*)$',
		'^#database/(.*)$',
		'^#events/(.*)$',
		'^#exceptions/(.*)$',
		'^#listeners/(.*)$',
		'^#mails/(.*)$',
		'^#middleware/(.*)$',
		'^#models/(.*)$',
		'^#policies/(.*)$',
		'^#providers/(.*)$',
		'^#services/(.*)$',
		'^#start/(.*)$',
		'^#test-helpers/(.*)$',
		'^#tests/(.*)$',
		'^#types/(.*)$',
		'^#validators/(.*)$',
		'^#utils/(.*)$',
		'',
		'^~/(.*)$',
		'',
		'^[./]',
	],
	importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
	importOrderTypeScriptVersion: '5.4.5',
};
