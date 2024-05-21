import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

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

	test('GET / with logged user has user as prop', async ({ client, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
		});
		const serializedUser = user.serialize({ fields: ['id', 'email', 'updatedAt', 'createdAt'] });

		await user.save();

		const response = await client.get(route('home')).loginAs(user).withInertia();

		response.assertStatus(200);
		response.assertInertiaPropsContains({
			user: serializedUser,
		});

		hash.restore();
	});

	test('POST /login with invalid body returns validation errors', async ({ client, route }) => {
		const response = await client
			.post(route('auth.login'))
			.json({
				email: 'not-an-email',
				password: '',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be a valid email address'],
				password: ['The password field must be defined'],
			},
		});
	});

	test('POST /login with invalid credentials returns error', async ({ client, route }) => {
		const response = await client
			.post(route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Error,
				message: 'Invalid user credentials',
			},
		});
	});

	test('POST /login with valid credentials logs user in', async ({ client, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
		});

		await user.save();

		const response = await client
			.post(route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('home');

		hash.restore();
	});
});
