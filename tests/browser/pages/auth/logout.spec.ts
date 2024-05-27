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

	test('Home page show logout button when logged in', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!' });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('home'));

		const logoutButton = page.getByRole('button', { name: 'Logout' });

		await page.assertExists(logoutButton);

		await logoutButton.click();
		await page.waitForTimeout(500);

		/* if (browser.browserType().name() !== 'webkit') {
			await page.waitForNavigation();
		} */

		await page.assertNotExists(logoutButton);

		hash.restore();
	});

	test('Show confirmation message returned by the server when submitting the form', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!' });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('home'));

		await page.getByRole('button', { name: 'Logout' }).click();
		await page.waitForURL(route('home'));
		await page.waitForTimeout(500);

		await page.assertVisible(page.getByText('You have been successfully logged out'));

		hash.restore();
	});
});
