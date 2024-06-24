import type { HttpContext } from '@adonisjs/core/http';
import mail from '@adonisjs/mail/services/main';

import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import { NotificationType } from '#types/notification';

export default class VerifyEmailController {
	async handle({ params, request, response, session }: HttpContext) {
		if (!request.hasValidSignature('verify-email')) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Invalid or expired verification link',
			});

			response.redirect().toRoute('auth.login');

			return;
		}

		const email = params.email as string;
		const user = await User.findBy('email', email);

		if (!user) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'User not found',
			});

			response.redirect().toRoute('auth.login');

			return;
		}

		if (user.isVerified) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Your email has already been verified',
			});

			response.redirect().toRoute('auth.login');

			return;
		}

		user.isVerified = true;

		await user.save();

		session.flash('notification', {
			type: NotificationType.Success,
			message: 'Your email has been successfully verified',
		});

		response.redirect().toRoute('auth.login');
	}

	async resend({ request, session, response }: HttpContext) {
		const email = request.input('email') as string;
		const user = await User.findBy('email', email);

		if (!user) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'User not found',
			});

			response.redirect().back();

			return;
		}

		if (user.isVerified) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Your email has already been verified',
			});

			response.redirect().back();

			return;
		}

		mail.send(new VerifyEmailNotification(user));

		response.redirect().back();
	}
}
