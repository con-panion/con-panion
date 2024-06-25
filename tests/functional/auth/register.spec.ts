import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import router from '@adonisjs/core/services/router';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';

import { UserFactory } from '#database/factories/user-factory';
import VerifyEmailNotification from '#mails/verify-email-notification';
import Token from '#models/token';
import User from '#models/user';
import VerifyEmailService from '#services/verify-email-service';
import env from '#start/env';
import MockVerifyEmailService from '#test-helpers/mocks/mock-verify-email-service';
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

	test('POST /register with valid body creates a new user and sends verification email', async ({
		assert,
		client,
		route,
		expect,
	}) => {
		hash.fake();

		const { mails } = mail.fake();

		const mockVerifyEmailService = new MockVerifyEmailService();

		app.container.swap(VerifyEmailService, () => {
			return mockVerifyEmailService;
		});

		const response = await client
			.post(route('auth.register'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
				passwordConfirmation: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		expect(mockVerifyEmailService.generateToken).toHaveBeenCalledTimes(1);
		expect(mockVerifyEmailService.clearPreviousToken).toHaveBeenCalledTimes(1);

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Info,
				message: 'Please check your emails to verify your account',
				actionLabel: 'Resend email',
				actionUrl: '/verify-email/resend',
				actionBody: {
					email: 'test@test.fr',
				},
			},
		});

		const user = await User.findByOrFail('email', 'test@test.fr');
		const stringToken = (await mockVerifyEmailService.generateToken.mock.results[0].value) as string;

		mails.assertQueued(VerifyEmailNotification, (email) => {
			email.message.assertTo(user.email);
			email.message.assertSubject('Email Verification');

			const verifyEmailUrl = router
				.builder()
				.prefixUrl(env.get('APP_URL'))
				.params({ token: stringToken })
				.make('auth.verify-email');

			assert.isTrue(email.message.toJSON().message.text?.toString().includes(verifyEmailUrl));

			return true;
		});

		const token = await Token.findByOrFail('token', stringToken);
		const updatedUser = await User.findOrFail(user.id);

		assert.equal(token.type, 'verify-email');
		assert.equal(token.userId, updatedUser.id);
		assert.isAbove(token.expiresAt, DateTime.now());

		const userTokens = await updatedUser.related('tokens').query();
		const userVerifyEmailToken = await updatedUser.related('verifyEmailToken').query().firstOrFail();

		assert.notEmpty(userTokens);
		assert.equal(userTokens[0].id, token.id);
		assert.equal(userVerifyEmailToken.id, token.id);

		app.container.restore(VerifyEmailService);
		hash.restore();
	});
});
