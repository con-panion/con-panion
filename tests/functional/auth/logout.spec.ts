import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import { NotificationType } from '#types/notification';

test.group('Auth logout', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('DELETE /logout logs out user', async ({ client, route }) => {
		hash.fake();

		const user = await UserFactory.create();
		const response = await client.delete(route('auth.logout')).loginAs(user).withCsrfToken().withInertia();

		response.assertStatus(200);
		response.assertRedirectsTo(route('home'));
		response.assertInertiaProps({
			notification: {
				type: NotificationType.Success,
				message: 'You have been successfully logged out',
			},
		});

		hash.restore();
	});
});
