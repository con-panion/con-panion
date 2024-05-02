import type { Authenticators } from '@adonisjs/auth/types';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * Guest middleware is used to deny access to routes that should
 * be accessed by unauthenticated users.
 *
 * For example, the login page should not be accessible if the user
 * is already logged-in
 */
export default class GuestMiddleware {
	/**
	 * The URL to redirect to when user is logged-in
	 */
	redirectTo = '/';

	async handle(context: HttpContext, next: NextFn, options: { guards?: (keyof Authenticators)[] } = {}) {
		const guards = options.guards ?? [context.auth.defaultGuard];

		for (const guard of guards) {
			// eslint-disable-next-line no-await-in-loop
			if (await context.auth.use(guard).check()) {
				context.response.redirect(this.redirectTo, true);

				return;
			}
		}

		return next() as unknown;
	}
}
