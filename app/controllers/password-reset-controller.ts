import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import mail from '@adonisjs/mail/services/main';

import PasswordResetRequestNotification from '#mails/password-reset-request-notification';
import User from '#models/user';
import PasswordResetService from '#services/password-reset-service';
import { NotificationType } from '#types/notification';
import { forgotPasswordSchema, passwordResetValidator } from '#validators/auth';

export default class ResetPasswordsController {
	async forgot({ inertia }: HttpContext) {
		return inertia.render('auth/forgot-password');
	}

	/* eslint-disable-next-line @typescript-eslint/member-ordering */
	@inject()
	async sendMail({ request, response, session }: HttpContext, passwordResetService: PasswordResetService) {
		const { email } = await forgotPasswordSchema.validate(request.all());
		const user = await User.findBy('email', email);
		const token = await passwordResetService.generateToken(user);

		if (user) {
			mail.sendLater(new PasswordResetRequestNotification(user, token));
		}

		session.flash('notification', {
			type: NotificationType.Info,
			message: 'If the email exists in our system, we will send you an email with instructions to reset your password',
		});

		response.redirect().toRoute('auth.forgot-password');
	}

	/* eslint-disable-next-line @typescript-eslint/member-ordering */
	@inject()
	async reset({ params, session, response, inertia }: HttpContext, passwordResetService: PasswordResetService) {
		const token = params.token as string;

		if (!token) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Password reset token missing',
			});

			response.redirect().toRoute('auth.forgot-password');

			return;
		}

		const isTokenValid = await passwordResetService.verifyToken(token);

		if (!isTokenValid) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Invalid or expired password reset token',
			});

			response.redirect().toRoute('auth.forgot-password');

			return;
		}

		return inertia.render('auth/password-reset', { token });
	}

	/* eslint-disable-next-line @typescript-eslint/member-ordering */
	@inject()
	async update({ params, request, session, response }: HttpContext, passwordResetService: PasswordResetService) {
		const token = params.token as string;

		if (!token) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Password reset token missing',
			});

			response.redirect().toRoute('auth.forgot-password');

			return;
		}

		const user = await passwordResetService.getUserByToken(token);

		if (!user) {
			session.flash('notification', {
				type: NotificationType.Error,
				message: 'Invalid/expired password reset token or user not found',
			});

			response.redirect().toRoute('auth.forgot-password');

			return;
		}

		const { password } = await passwordResetValidator.validate(request.all());

		await user.merge({ password }).save();
		await passwordResetService.clearTokens(user);

		session.flash('notification', {
			type: NotificationType.Success,
			message: 'Your password has been successfully reset',
		});

		response.redirect().toRoute('auth.login');
	}
}
