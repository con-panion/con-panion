import { errors as authErrors } from '@adonisjs/auth';
import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http';
import { errors as vineErrors, type SimpleErrorReporter } from '@vinejs/vine';

export default class HttpExceptionHandler extends ExceptionHandler {
	/**
	 * In debug mode, the exception handler will display verbose errors
	 * with pretty printed stack traces.
	 */
	protected debug = !app.inProduction;

	/**
	 * Status pages are used to display a custom HTML pages for certain error
	 * codes. You might want to enable them in production only, but feel
	 * free to enable them in development as well.
	 */
	protected renderStatusPages = app.inProduction;

	/**
	 * Status pages is a collection of error code range and a callback
	 * to return the HTML contents to send as a response.
	 */
	protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
		'404': (error, { inertia }) => inertia.render('errors/not-found', { error }),
		'500..599': (error, { inertia }) => inertia.render('errors/server-error', { error }),
	};

	/**
	 * The method is used for handling errors and returning
	 * response to the client
	 */
	async handle(error: unknown, context: HttpContext) {
		if (error instanceof vineErrors.E_VALIDATION_ERROR) {
			const validatorErrors = error.messages as SimpleErrorReporter['errors'];
			const schemaErrors: Record<string, string> = {};

			for (const validatorError of validatorErrors) {
				const { field, message } = validatorError;
				const path = field;

				if (!(path in schemaErrors)) {
					schemaErrors[path] = message;
				}
			}

			context.session.flashErrors(schemaErrors);
		}

		if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
			context.session.flash('notification', {
				type: 'error',
				message: error.message,
			});

			return super.handle(error, context);
		}

		return super.handle(error, context);
	}

	/**
	 * The method is used to report error to the logging service or
	 * the a third party error monitoring service.
	 *
	 * @note You should not attempt to send a response from this method.
	 */
	async report(error: unknown, context: HttpContext) {
		return super.report(error, context);
	}
}
