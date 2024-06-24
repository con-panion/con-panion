/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import router from '@adonisjs/core/services/router';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';

import { UserFactory } from '#database/factories/user-factory';
import PasswordResetRequestNotification from '#mails/password-reset-request-notification';
import Token from '#models/token';
import User from '#models/user';
import PasswordResetService from '#services/password-reset-service';
import env from '#start/env';
import MockPasswordResetService from '#test-helpers/mocks/mock-password-reset-service';
import { timeTravel } from '#test-helpers/time-travel';
import { NotificationType } from '#types/notification';

test.group('Auth password reset', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('GET /forgot-password renders auth/forgot-password view', async ({ client, route }) => {
		const response = await client.get(route('auth.forgot-password')).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/forgot-password');
		response.assertInertiaProps({});
	});

	test('GET /forgot-password with logged user redirects to home', async ({ client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const response = await client.get(route('auth.forgot-password')).loginAs(user).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('home'));

		hash.restore();
	});

	test('POST /forgot-password with empty body returns validation errors', async ({ client, route }) => {
		const response = await client
			.post(route('auth.forgot-password'))
			.header('referrer', route('auth.forgot-password'))
			.json({})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be defined'],
			},
		});
	});

	test('POST /forgot-password with invalid body returns validation errors', async ({ client, route }) => {
		const response = await client
			.post(route('auth.forgot-password'))
			.header('referrer', route('auth.forgot-password'))
			.json({ email: 'not-an-email' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be a valid email address'],
			},
		});
	});

	test("POST /forgot-password with email not in database show email notification but doesn't send email", async ({
		client,
		route,
	}) => {
		const { mails } = mail.fake();

		const response = await client
			.post(route('auth.forgot-password'))
			.header('referrer', route('auth.forgot-password'))
			.json({ email: 'test@test.fr' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Info,
				message:
					'If the email exists in our system, we will send you an email with instructions to reset your password',
			},
		});

		mails.assertNotSent(PasswordResetRequestNotification);
	});

	test('POST /forgot-password with email in database sends email and show email notification', async ({
		client,
		route,
		assert,
		expect,
	}) => {
		hash.fake();

		const { mails } = mail.fake();

		const mockPasswordResetService = new MockPasswordResetService();

		app.container.swap(PasswordResetService, () => {
			return mockPasswordResetService;
		});

		const user = await UserFactory.create();
		const response = await client
			.post(route('auth.forgot-password'))
			.header('referrer', route('auth.forgot-password'))
			.json({ email: user.email })
			.withCsrfToken()
			.withInertia();

		expect(mockPasswordResetService.generateToken).toHaveBeenCalledTimes(1);
		expect(mockPasswordResetService.clearPreviousToken).toHaveBeenCalledTimes(1);

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Info,
				message:
					'If the email exists in our system, we will send you an email with instructions to reset your password',
			},
		});

		const stringToken = (await mockPasswordResetService.generateToken.mock.results[0].value) as string;

		mails.assertQueued(PasswordResetRequestNotification, (email) => {
			email.message.assertTo(user.email);
			email.message.assertSubject('Password Reset Request');

			const passwordResetUrlWithoutToken = router
				.builder()
				.prefixUrl(env.get('APP_URL'))
				.params({ token: '' })
				.make('auth.password-reset');

			assert.equal(
				email.message
					.toJSON()
					.message.text?.toString()
					.match(new RegExp(`^${passwordResetUrlWithoutToken}(.{64})$`, 'm'))?.[1],
				stringToken,
			);

			return true;
		});

		const token = await Token.findBy('token', stringToken);
		const updatedUser = await User.find(user.id);

		if (!token || !updatedUser) {
			return assert.fail();
		}

		assert.equal(token.type, 'password-reset');
		assert.equal(token.userId, updatedUser.id);
		assert.isAbove(token.expiresAt, DateTime.now());

		const userTokens = await updatedUser.related('tokens').query();
		const userPasswordResetToken = await updatedUser.related('passwordResetToken').query().first();

		assert.notEmpty(userTokens);
		assert.equal(userTokens[0].id, token.id);
		assert.exists(userPasswordResetToken);
		assert.equal(userPasswordResetToken!.id, token.id);

		app.container.restore(PasswordResetService);
		hash.restore();
	});

	test('GET /password-reset/:token without token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
	}) => {
		const response = await client.get(route('auth.password-reset', { token: '' })).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Password reset token missing',
			},
		});
	});

	test('GET /password-reset/:token with invalid token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
		assert,
		expect,
	}) => {
		const mockPasswordResetService = new MockPasswordResetService();

		app.container.swap(PasswordResetService, () => {
			return mockPasswordResetService;
		});

		const response = await client.get(route('auth.password-reset', { token: 'invalid-token' })).withInertia();

		expect(mockPasswordResetService.verifyToken).toHaveBeenCalledTimes(1);
		expect(mockPasswordResetService.verifyToken).toHaveBeenCalledWith('invalid-token');

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired password reset token',
			},
		});

		assert.isFalse(await mockPasswordResetService.verifyToken('invalid-token'));

		app.container.restore(PasswordResetService);
	});

	test('GET /password-reset/:token with expired token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		timeTravel('1h');

		const response = await client.get(route('auth.password-reset', { token })).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired password reset token',
			},
		});
	});

	test('GET /password-reset/:token with valid token renders auth/password-reset view', async ({ client, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const response = await client.get(route('auth.password-reset', { token })).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/password-reset');
		response.assertInertiaProps({ token });

		hash.restore();
	});

	test('PATCH /password-reset/:token with invalid token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
		expect,
		assert,
	}) => {
		const mockPasswordResetService = new MockPasswordResetService();

		app.container.swap(PasswordResetService, () => {
			return mockPasswordResetService;
		});

		const response = await client
			.patch(route('auth.password-reset', { token: 'test' }))
			.header('referrer', route('auth.password-reset', { token: 'test' }))
			.json({})
			.withCsrfToken()
			.withInertia();

		expect(mockPasswordResetService.getUserByToken).toHaveBeenCalledTimes(1);
		expect(mockPasswordResetService.getUserByToken).toHaveBeenCalledWith('test');

		assert.notExists(await mockPasswordResetService.getUserByToken('test'));

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid/expired password reset token or user not found',
			},
		});

		app.container.restore(PasswordResetService);
	});

	test('PATCH /password-reset/:token with expired token shows error notification and redirects to /forgot-password', async ({
		assert,
		client,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		timeTravel('1h');

		const response = await client
			.patch(route('auth.password-reset', { token }))
			.header('referrer', route('auth.password-reset', { token }))
			.json({})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid/expired password reset token or user not found',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.equal(updatedUser!.password, user.password);

		hash.restore();
	});

	test('PATCH /password-reset/:token with valid token and empty body shows validation errors', async ({
		client,
		route,
		assert,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const response = await client
			.patch(route('auth.password-reset', { token }))
			.header('referrer', route('auth.password-reset', { token }))
			.json({})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/password-reset');
		response.assertInertiaPropsContains({
			errors: {
				password: ['The password field must be defined'],
				passwordConfirmation: ['The passwordConfirmation field must be defined'],
			},
		});

		const updatedUser = await User.find(user.id);

		assert.equal(updatedUser!.password, user.password);

		hash.restore();
	});

	test('PATCH /password-reset/:token with valid token and invalid body shows validation errors', async ({
		client,
		route,
		assert,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const response = await client
			.patch(route('auth.password-reset', { token }))
			.header('referrer', route('auth.password-reset', { token }))
			.json({ password: 'password', passwordConfirmation: 'not-the-same-password' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.password-reset', { token }));
		response.assertInertiaPropsContains({
			errors: {
				password: ['The password field format is invalid'],
				passwordConfirmation: ['The passwordConfirmation field and password field must be the same'],
			},
		});

		const updatedUser = await User.find(user.id);

		assert.equal(updatedUser!.password, user.password);

		hash.restore();
	});

	test('PATCH /password-reset/:token with valid token and valid body resets password', async ({
		client,
		route,
		assert,
		expect,
	}) => {
		hash.fake();

		const mockPasswordResetService = new MockPasswordResetService();

		app.container.swap(PasswordResetService, () => {
			return mockPasswordResetService;
		});

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const stringToken = await passwordResetService.generateToken(user);
		const response = await client
			.patch(route('auth.password-reset', { token: stringToken }))
			.json({ password: 'Test123!', passwordConfirmation: 'Test123!' })
			.withCsrfToken()
			.withInertia();

		expect(mockPasswordResetService.clearPreviousToken).toHaveBeenCalledTimes(1);

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Success,
				message: 'Your password has been successfully reset',
			},
		});

		const updatedUser = await User.find(user.id);

		if (!updatedUser) {
			return assert.fail();
		}

		assert.notEqual(updatedUser.password, user.password);
		assert.isTrue(await hash.verify(updatedUser.password, 'Test123!'));

		const token = await Token.findBy('token', stringToken);
		const userTokens = await updatedUser.related('tokens').query();
		const userPasswordResetToken = await updatedUser.related('passwordResetToken').query().first();

		assert.notExists(token);
		assert.empty(userTokens);
		assert.notExists(userPasswordResetToken);

		app.container.restore(PasswordResetService);

		hash.restore();
	});

	test('PATCH /password-reset/:token with used token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		await client
			.patch(route('auth.password-reset', { token }))
			.json({ password: 'Test123!', passwordConfirmation: 'Test123!' })
			.withCsrfToken()
			.withInertia();

		const response = await client.get(route('auth.password-reset', { token })).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired password reset token',
			},
		});
	});

	test('GET /password-reset/:token with old token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
		assert,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const stringToken = await passwordResetService.generateToken(user);

		await passwordResetService.generateToken(user);

		const response = await client.get(route('auth.password-reset', { token: stringToken })).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired password reset token',
			},
		});

		const updatedUser = await User.find(user.id);

		if (!updatedUser) {
			return assert.fail();
		}

		const token = await Token.findBy('token', stringToken);
		const userTokens = await updatedUser.related('tokens').query();
		const userPasswordResetToken = await updatedUser.related('passwordResetToken').query().first();

		assert.notExists(token);
		assert.notEmpty(userTokens);
		assert.notEqual(userTokens[0].token, stringToken);
		assert.exists(userPasswordResetToken);
		assert.notEqual(userPasswordResetToken!.token, stringToken);
	});

	test('PATCH /password-reset/:token with used token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
		assert,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const stringToken = await passwordResetService.generateToken(user);

		await client
			.patch(route('auth.password-reset', { token: stringToken }))
			.json({ password: 'Test123!', passwordConfirmation: 'Test123!' })
			.withCsrfToken()
			.withInertia();

		const response = await client
			.patch(route('auth.password-reset', { token: stringToken }))
			.header('referrer', route('auth.password-reset', { token: stringToken }))
			.json({ password: 'Test456!', passwordConfirmation: 'Test456!' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid/expired password reset token or user not found',
			},
		});

		const updatedUser = await User.find(user.id);

		if (!updatedUser) {
			return assert.fail();
		}

		assert.isFalse(await hash.verify(updatedUser.password, 'Test456!'));

		const token = await Token.findBy('token', stringToken);
		const userTokens = await updatedUser.related('tokens').query();
		const userPasswordResetToken = await updatedUser.related('passwordResetToken').query().first();

		assert.notExists(token);
		assert.empty(userTokens);
		assert.notExists(userPasswordResetToken);

		hash.restore();
	});

	test('PATCH /password-reset/:token with old token shows error notification and redirects to /forgot-password', async ({
		client,
		route,
		assert,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		await passwordResetService.generateToken(user);

		const response = await client
			.patch(route('auth.password-reset', { token }))
			.header('referrer', route('auth.password-reset', { token }))
			.json({ password: 'Test456!', passwordConfirmation: 'Test456!' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.forgot-password'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid/expired password reset token or user not found',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isFalse(await hash.verify(updatedUser!.password, 'Test456!'));

		hash.restore();
	});
});
