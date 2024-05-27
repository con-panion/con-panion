import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import User from '#models/user';

test.group('Auth logout', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('DELETE /logout logs out user', async ({ client, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
		});

		const response = await client.delete(route('auth.logout')).loginAs(user).withCsrfToken().withInertia();

		response.assertStatus(200);
		response.assertInertiaComponent('home');
		response.assertInertiaProps({
			notification: {
				message: 'You have been successfully logged out',
				type: 'success',
			},
		});

		hash.restore();
	});
});
