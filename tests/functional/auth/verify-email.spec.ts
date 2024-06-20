import hash from '@adonisjs/core/services/hash';
import router from '@adonisjs/core/services/router';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import env from '#start/env';
import { timeTravel } from '#test-helpers/time-travel';
import { NotificationType } from '#types/notification';

test.group('Auth verify email', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('GET /verify-email/:email with incomplete signature returns error', async ({ assert, client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			})
			.slice(0, -2);
		const response = await client.get(verifyEmailUrl).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired verification link',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isFalse(updatedUser!.isVerified);

		hash.restore();
	});

	test('GET /verify-email/:email with expired signature returns error', async ({ assert, client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});

		timeTravel('1d');

		const response = await client.get(verifyEmailUrl).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid or expired verification link',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isFalse(updatedUser!.isVerified);

		hash.restore();
	});

	test('GET /verify-email/:email with unknown email returns error', async ({ client, route }) => {
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: 'wrong@email.fr' })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const response = await client.get(verifyEmailUrl).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'User not found',
			},
		});
	});

	test('GET /verify-email/:email with verified user returns error', async ({ assert, client, route }) => {
		hash.fake();

		const user = await UserFactory.apply('verified').create();
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const response = await client.get(verifyEmailUrl).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Your email has already been verified',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isTrue(updatedUser!.isVerified);

		hash.restore();
	});

	test('GET /verify-email/:email with valid signature verify user', async ({ assert, client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const response = await client.get(verifyEmailUrl).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Success,
				message: 'Your email has been successfully verified',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isTrue(updatedUser!.isVerified);

		hash.restore();
	});

	test('POST /verify-email/resend with unknown email returns error', async ({ route, client }) => {
		const { mails } = mail.fake();

		const response = await client
			.post(route('auth.verify-email.resend'))
			.json({ email: 'wrong@email.fr' })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'User not found',
			},
		});

		mails.assertNotSent(VerifyEmailNotification);
	});

	test('POST /verify-email/resend with verified user returns error', async ({ route, client }) => {
		hash.fake();

		const { mails } = mail.fake();

		const user = await UserFactory.apply('verified').create();
		const response = await client
			.post(route('auth.verify-email.resend'))
			.json({ email: user.email })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Your email has already been verified',
			},
		});

		mails.assertNotSent(VerifyEmailNotification);

		hash.restore();
	});

	test('POST /verify-email/resend with valid payload sends verification email', async ({ assert, route, client }) => {
		hash.fake();

		const { mails } = mail.fake();

		const user = await UserFactory.create();
		const response = await client
			.post(route('auth.verify-email.resend'))
			.json({ email: user.email })
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('auth.login'));

		let verifyEmailUrl: string | undefined;
		mails.assertSent(VerifyEmailNotification, (email) => {
			email.message.assertTo(user.email);
			email.message.assertSubject('Email Verification');

			const verifyEmailUrlWithoutSignature = router
				.builder()
				.prefixUrl(env.get('APP_URL'))
				.params({ email: user.email })
				.make('auth.verify-email');

			verifyEmailUrl = email.message
				.toJSON()
				.message.text?.toString()
				.match(new RegExp(`^${verifyEmailUrlWithoutSignature}.*?$`, 'm'))?.[0];

			return !!verifyEmailUrl;
		});

		const verifyResponse = await client.get(verifyEmailUrl!).withInertia();

		verifyResponse.assertStatus(200);
		verifyResponse.assertRedirectsTo(route('auth.login'));
		verifyResponse.assertInertiaProps({
			notification: {
				type: NotificationType.Success,
				message: 'Your email has been successfully verified',
			},
		});

		const updatedUser = await User.find(user.id);

		assert.isTrue(updatedUser!.isVerified);

		hash.restore();
	});
});
