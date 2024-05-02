import { defineConfig } from '@adonisjs/inertia';

export default defineConfig({
	/**
	 * Path to the Edge view that will be used as the root view for Inertia responses
	 */
	rootView: 'inertia_layout',

	/**
	 * Data that should be shared with all rendered pages
	 */
	sharedData: {
		errors: (context) => context.session.flashMessages.get('errors') as unknown,
	},

	/**
	 * Options for the server-side rendering
	 */
	ssr: {
		enabled: true,
		entrypoint: 'inertia/app/ssr.tsx',
	},
});
