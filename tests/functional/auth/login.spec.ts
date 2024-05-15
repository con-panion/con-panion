import { Secret } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import User from '#models/user';
import { timeTravel } from '#test-helpers/time-travel';
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
			.withCsrfToken();

		response.assertStatus(409);
		response.assertFlashMessage('notification', {
			type: NotificationType.Success,
			message: 'You have been logged in successfully',
		});

		hash.restore();
	});

	test('POST /login without rememberMe parameter returns empty cookie', async ({ assert, client, route }) => {
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
				rememberMe: false,
			})
			.withCsrfToken();
		const cookie = response.cookie('remember_web');

		assert.exists(cookie);
		assert.empty(cookie?.value);
		assert.equal(cookie?.maxAge, -1);
		assert.notExists(await User.rememberMeTokens.verify(new Secret(cookie?.value as string)));

		hash.restore();
	});

	test('POST /login with rememberMe parameter returns valid cookie', async ({ assert, client, route }) => {
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
				rememberMe: true,
			})
			.withCsrfToken();
		const cookie = response.cookie('remember_web');

		assert.exists(cookie);
		assert.notEmpty(cookie?.value);
		assert.equal(cookie?.maxAge, 31_557_600);

		const rememberMeToken = await User.rememberMeTokens.verify(new Secret(cookie?.value as string));

		assert.exists(rememberMeToken);
		assert.isFalse(rememberMeToken?.isExpired());

		timeTravel('1 year');

		assert.isTrue(rememberMeToken?.isExpired());

		hash.restore();
	});

	test('GET / without rememberMe cookie has no user as props', async ({ client, route }) => {
		hash.fake();

		const response = await client
			.get(route('home'))
			.withEncryptedCookie('adonis-session', '')
			.withEncryptedCookie('remember_web', '')
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaProps({});

		hash.restore();
	});

	test('GET / with valid rememberMe cookie has user as props', async ({ client, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
		});
		const userSerialized = user.serialize({ fields: ['id', 'email', 'updatedAt', 'createdAt'] });

		await user.save();

		const loginResponse = await client
			.post(route('auth.login'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
				rememberMe: true,
			})
			.withCsrfToken();
		const rememberWebCookie = loginResponse.cookie('remember_web');

		const response = await client
			.get(route('home'))
			.withEncryptedCookie('adonis-session', '')
			.withEncryptedCookie('remember_web', rememberWebCookie?.value)
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaProps({ user: userSerialized });

		hash.restore();
	});
});
