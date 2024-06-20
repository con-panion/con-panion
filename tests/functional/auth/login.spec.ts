import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import User from '#models/user';
import { NotificationType } from '#types/notification';

test.group('Auth login', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('GET /login renders auth/login view', async ({ client, route }) => {
		const response = await client.get(route('auth.login')).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/login');
		response.assertInertiaProps({});
	});

	test('GET /login with logged user redirects to home', async ({ client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const response = await client.get(route('auth.login')).loginAs(user).withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('home'));

		hash.restore();
	});

	test('GET / with logged user has user as prop', async ({ client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const serializedUser = user.serialize({ fields: ['id', 'email', 'updatedAt', 'createdAt'] });
		const response = await client.get(route('home')).loginAs(user).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('home');
		response.assertInertiaPropsContains({
			user: serializedUser,
		});

		hash.restore();
	});

	test('POST /login with empty body returns validation errors', async ({ client, route }) => {
		const response = await client
			.post(route('auth.login'))
			.header('referrer', route('auth.login'))
			.json({})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/login');
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be defined'],
				password: ['The password field must be defined'],
			},
		});
	});

	test('POST /login with invalid body returns validation errors', async ({ client, route }) => {
		const response = await client
			.post(route('auth.login'))
			.header('referrer', route('auth.login'))
			.json({
				email: 'not-an-email',
				password: '',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/login');
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be a valid email address'],
				password: ['The password field must be defined'],
			},
		});
	});

	test('POST /login with invalid credentials returns error notification', async ({ client, route }) => {
		const response = await client
			.post(route('auth.login'))
			.header('referrer', route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/login');
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid user credentials',
			},
		});
	});

	test('POST /login with valid credentials and unverified user returns verify email notification', async ({
		client,
		route,
	}) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: false,
		});

		await user.save();

		const response = await client
			.post(route('auth.login'))
			.header('referrer', route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/login');
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

		hash.restore();
	});

	test('POST /login with valid credentials and verified user logs user in', async ({ client, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: true,
		});

		await user.save();

		const response = await client
			.post(route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.redirects(0)
			.withCsrfToken();

		response.assertStatus(302);
		response.assertFlashMessage('notification', {
			type: NotificationType.Success,
			message: 'You have been logged in successfully',
		});

		const redirectionResponse = await client
			.post(route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		redirectionResponse.assertStatus(200);
		redirectionResponse.assertRedirectsTo(route('home'));

		hash.restore();
	});
});
