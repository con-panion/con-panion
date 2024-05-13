import type { HttpContext } from '@adonisjs/core/http';

import User from '#models/user';
import { NotificationType } from '#types/notification';
import { registerSchema } from '#validators/auth';

export default class RegisterController {
	async render({ inertia }: HttpContext) {
		return inertia.render('auth/register');
	}

	async handle({ request, auth, session, inertia }: HttpContext) {
		const { email, password } = await registerSchema(true).validate(request.all());
		const user = await User.create({ email, password });

		await auth.use('web').login(user);

		session.flash('notification', {
			type: NotificationType.Success,
			message: 'Account created successfully',
		});

		inertia.location('/');
	}
}
