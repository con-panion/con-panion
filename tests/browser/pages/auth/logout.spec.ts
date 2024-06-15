import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import User from '#models/user';

test.group('Auth logout', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());
	test("Home page don't show logout button when not logged in", async ({ visit, route }) => {
		const page = await visit(route('home'));

		await page.assertNotExists(page.getByRole('button', { name: 'Logout' }));
	});

	test('Home page show logout button when logged in', async ({ visit, route, browserContext }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: true,
		});

		await browserContext.loginAs(user);

		const page = await visit(route('home'));
		const logoutButton = page.getByRole('button', { name: 'Logout' });

		await page.assertExists(logoutButton);

		await logoutButton.click();
		await page.waitForTimeout(100);

		await page.assertNotExists(logoutButton);

		hash.restore();
	});

	test('Show confirmation message returned by the server when submitting the form', async ({
		visit,
		route,
		browserContext,
	}) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: true,
		});

		await browserContext.loginAs(user);

		const page = await visit(route('home'));

		await page.getByRole('button', { name: 'Logout' }).click();
		await page.waitForURL(route('home'));
		await page.waitForTimeout(100);

		await page.assertVisible(page.getByText('You have been successfully logged out'));

		hash.restore();
	});
});
