import type { HttpContext } from '@adonisjs/core/http';
import router from '@adonisjs/core/services/router';

import User from '#models/user';
import { NotificationType } from '#types/notification';
import { loginValidator } from '#validators/auth';

export default class LoginController {
	async render({ inertia }: HttpContext) {
		return inertia.render('auth/login');
	}

	async handle({ request, auth, response, session }: HttpContext) {
		const { email, password, rememberMe } = await loginValidator.validate(request.all());
		const user = await User.verifyCredentials(email, password);

		if (!user.isVerified) {
			session.flash('notification', {
				type: NotificationType.Info,
				message: 'Please check your email to verify your account',
				actionLabel: 'Resend email',
				actionUrl: router.makeUrl('auth.verify-email.resend'),
				actionBody: { email: user.email },
			});

			response.redirect().toRoute('auth.login');

			return;
		}

		await auth.use('web').login(user, !!rememberMe);

		session.flash('notification', {
			type: NotificationType.Success,
			message: 'You have been logged in successfully',
		});

		response.redirect().toRoute('home');
	}
}
