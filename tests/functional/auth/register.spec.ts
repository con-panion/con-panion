import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import User from '#models/user';
import { NotificationType } from '#types/notification';

test.group('Auth register', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Hashes user password when creating a new user', async ({ assert }) => {
		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
		});

		await user.save();

		assert.isTrue(hash.isValidHash(user.password));
		assert.isTrue(await hash.verify(user.password, 'Test123!'));
	});

	test('Can register with a new email', async ({ assert }) => {
		const user = await UserFactory.create();
		const registeredUser = await User.findBy('email', user.email);

		assert.exists(registeredUser);
	});

	test("Can't register with an existing email", async ({ assert }) => {
		const user = await UserFactory.create();

		try {
			await User.create({ email: user.email, password: 'password' });

			assert.fail();
		} catch {
			assert.isTrue(true);
		}
	});

	test('GET /register renders auth/register view', async ({ client, route }) => {
		const response = await client.get(route('auth.register')).withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('auth/register');
		response.assertInertiaProps({});
	});

	test('POST /register with valid body creates a new user', async ({ assert, client, route }) => {
		hash.fake();

		const response = await client
			.post(route('auth.register'))
			.json({
				email: 'test@test.fr',
				password: 'Test123!',
				confirmPassword: 'Test123!',
			})
			.withCsrfToken();

		response.assertStatus(409);
		response.assertFlashMessage('notification', {
			type: NotificationType.Success,
			message: 'Account created successfully',
		});

		const user = await User.findBy('email', 'test@test.fr');

		assert.exists(user);

		hash.restore();
	});

	test('POST /register with invalid body returns validation errors', async ({ assert, client, route }) => {
		const response = await client
			.post(route('auth.register'))
			.json({
				email: 'not-an-email',
				password: 'password',
				confirmPassword: 'not-the-same-password',
			})
			.withCsrfToken()
			.withInertia();

		response.assertStatus(200);
		response.assertInertiaProps({
			errors: {
				email: ['The email field must be a valid email address'],
				password: ['The password field format is invalid'],
				confirmPassword: ['The confirmPassword field and password field must be the same'],
			},
		});

		const user = await User.findBy('email', 'not-an-email');

		assert.notExists(user);
	});
});
