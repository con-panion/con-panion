import router from '@adonisjs/core/services/router';
import { BaseMail } from '@adonisjs/mail';
import dedent from 'dedent';

import type User from '#models/user';
import env from '#start/env';

export default class VerifyEmailNotification extends BaseMail {
	from = env.get('APP_EMAIL');
	subject = 'Email Verification';

	constructor(public user: User) {
		super();
	}

	/**
	 * The "prepare" method is called automatically when
	 * the email is sent or queued.
	 */
	prepare() {
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: this.user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});

		this.message.to(this.user.email).text(
			dedent(`Welcome to Con-panion!
		
				Please verify your email address by clicking the link below:
				${verifyEmailUrl}
		
				Sincerely,
				Con-panion Team`),
		);
	}
}
