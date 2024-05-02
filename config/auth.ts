import { defineConfig } from '@adonisjs/auth';
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session';
import type { Authenticators, InferAuthEvents } from '@adonisjs/auth/types';

const authConfig = defineConfig({
	default: 'web',
	guards: {
		web: sessionGuard({
			useRememberMeTokens: false,
			provider: sessionUserProvider({
				model: () => import('#models/user'),
			}),
		}),
	},
});

export default authConfig;

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-shadow
	interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}

declare module '@adonisjs/core/types' {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface EventsList extends InferAuthEvents<Authenticators> {}
}
