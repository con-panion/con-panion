import type { HttpContext } from '@adonisjs/core/http';

import User from '#models/user';
import { loginValidator } from '#validators/auth';

export default class LoginController {
	async render({ inertia }: HttpContext) {
		return inertia.render('auth/login');
	}

	async handle({ request, auth, response, session }: HttpContext) {
		const { email, password, rememberMe } = await loginValidator.validate(request.all());
		const user = await User.verifyCredentials(email, password);

		await auth.use('web').login(user, !!rememberMe);

		session.flash('notification', {
			type: 'success',
			message: 'You have been logged in successfully',
		});

		response.redirect().toRoute('home');
	}
}
