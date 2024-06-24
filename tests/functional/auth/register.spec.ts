import hash from '@adonisjs/core/services/hash';
import router from '@adonisjs/core/services/router';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import env from '#start/env';
import { NotificationType } from '#types/notification';

test.group('Auth register', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('GET /register renders auth/register view', async ({ client, route }) => {
		const response = await client.get(route('auth.register')).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/register');
		response.assertInertiaProps({});
	});

	test('GET /register with logged user redirects to home', async ({ client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const response = await client.get(route('auth.register')).loginAs(user).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('home'));

		hash.restore();
	});

	test('POST /register with empty body returns validation errors', async ({ assert, client, route }) => {
		const { mails } = mail.fake();

		const response = await client
			.post(route('auth.register'))
			.header('referrer', route('auth.register'))
			.json({})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.register'));
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be defined'],
				password: ['The password field must be defined'],
				passwordConfirmation: ['The passwordConfirmation field must be defined'],
			},
		});

		const user = await User.first();

		mails.assertNotSent(VerifyEmailNotification);

		assert.notExists(user);
	});

	test('POST /register with invalid body returns validation errors', async ({ assert, client, route }) => {
		const { mails } = mail.fake();

		const response = await client
			.post(route('auth.register'))
			.header('referrer', route('auth.register'))
			.json({
				email: 'not-an-email',
				password: 'password',
				passwordConfirmation: 'not-the-same-password',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.register'));
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be a valid email address'],
				password: ['The password field format is invalid'],
				passwordConfirmation: ['The passwordConfirmation field and password field must be the same'],
			},
		});

		const user = await User.findBy('email', 'not-an-email');

		mails.assertNotSent(VerifyEmailNotification);

		assert.notExists(user);
	});

	test('POST /register with existing email returns validation errors', async ({ client, route }) => {
		const { mails } = mail.fake();

		const user = await UserFactory.create();

		const response = await client
			.post(route('auth.register'))
			.header('referrer', route('auth.register'))
			.json({
				email: user.email,
				password: 'Test123!',
				passwordConfirmation: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.register'));
		response.assertInertiaProps({
			errors: {
				email: ['The email has already been taken'],
			},
		});

		mails.assertNotSent(VerifyEmailNotification);
	});

	test('POST /register with valid body creates a new user and sends verification email', async ({ client, route }) => {
		hash.fake();

		const { mails } = mail.fake();

		const response = await client
			.post(route('auth.register'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
				passwordConfirmation: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Info,
				message: 'Please check your email to verify your account',
				actionLabel: 'Resend email',
				actionUrl: '/verify-email/resend',
				actionBody: {
					email: 'test@test.fr',
				},
			},
		});

		const user = await User.findByOrFail('email', 'test@test.fr');

		mails.assertSent(VerifyEmailNotification, (email) => {
			email.message.assertTo(user.email);
			email.message.assertSubject('Email Verification');

			const verifyEmailUrlWithoutSignature = router
				.builder()
				.prefixUrl(env.get('APP_URL'))
				.params({ email: user.email })
				.make('auth.verify-email');

			const verifyEmailUrl = email.message
				.toJSON()
				.message.text?.toString()
				.match(new RegExp(`^${verifyEmailUrlWithoutSignature}.*?$`, 'm'))?.[0];

			return !!verifyEmailUrl;
		});

		hash.restore();
	});
});
