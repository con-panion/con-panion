import type { HttpContext } from '@adonisjs/core/http';
import router from '@adonisjs/core/services/router';
import mail from '@adonisjs/mail/services/main';

import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import { NotificationType } from '#types/notification';
import { registerSchema } from '#validators/auth';

export default class RegisterController {
	async render({ inertia }: HttpContext) {
		return inertia.render('auth/register');
	}

	async handle({ request, session, response }: HttpContext) {
		const { email, password } = await registerSchema(true).validate(request.all());
		const user = await User.create({ email, password });

		await user.save();
		await mail.send(new VerifyEmailNotification(user));

		session.flash('notification', {
			type: NotificationType.Info,
			message: 'Please check your email to verify your account',
			actionLabel: 'Resend email',
			actionUrl: router.makeUrl('auth.verify-email.resend'),
			actionBody: { email: user.email },
		});

		response.redirect().toRoute('auth.login');
	}
}
