import { defineConfig } from '@adonisjs/inertia';

export default defineConfig({
	/**
	 * Path to the Edge view that will be used as the root view for Inertia responses
	 */
	rootView: 'inertia-layout',

	/**
	 * Data that should be shared with all rendered pages
	 */
	sharedData: {
		user: async (context) => {
			try {
				await context.auth.authenticate();
			} catch {
				return;
			}

			const { id, email, updatedAt, createdAt } = context.auth.user!;

			return { id, email, updatedAt, createdAt };
		},
		errors: (context) => context.session.flashMessages.get('errors') as unknown,
		notification: (context) => context.session.flashMessages.get('notification') as unknown,
	},

	/**
	 * Options for the server-side rendering
	 */
	ssr: {
		enabled: true,
		entrypoint: 'inertia/app/ssr.tsx',
	},
});
