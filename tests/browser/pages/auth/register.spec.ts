import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import User from '#models/user';

test.group('Auth register', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Register page show register form', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.register'));

		assert.snapshot(await page.innerHTML('body')).match();
	});

	test('Submit button is not activated when the form is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.assertDisabled('button[type="submit"]');

		await page.fill('input[name="email"]', 'not-an-email');
		await page.fill('input[name="password"]', 'password');
		await page.fill('input[name="confirmPassword"]', 'not-the-same-password');
		await page.assertDisabled('button[type="submit"]');
	});

	test('Submit button is activated when the form is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.assertDisabled('button[type="submit"]');

		await page.fill('input[name="email"]', 'test@test.fr');
		await page.fill('input[name="password"]', 'Test123!');
		await page.fill('input[name="confirmPassword"]', 'Test123!');
		await page.assertNotDisabled('button[type="submit"]');
	});

	test('Show error message when form field is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.fill('input[name="email"]', 'not-an-email');
		await page.assertVisible(page.getByText('The email field must be a valid email address'));

		await page.fill('input[name="password"]', 'password');
		await page.assertVisible(page.getByText('The password field format is invalid'));

		await page.fill('input[name="confirmPassword"]', 'not-the-same-password');
		await page.assertVisible(page.getByText('The confirmPassword field and password field must be the same'));
	});

	test('Remove error message when form field is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.fill('input[name="email"]', 'not-an-email');
		await page.fill('input[name="email"]', 'test@test.fr');
		await page.assertNotVisible(page.getByText('The email field must be a valid email address'));
	});

	test('Toggle password visibility when clicking on the eye icon', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.register'));
		const showPasswordButton = page.locator('input[name="password"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getAttribute('input[name="password"]', 'type')) === 'text');

		await showPasswordButton.click();
		assert.assert((await page.getAttribute('input[name="password"]', 'type')) === 'password');
	});

	test("Don't toggle password visibility when clicking on the eye icon for the other password field", async ({
		assert,
		visit,
		route,
	}) => {
		const page = await visit(route('auth.register'));
		const showPasswordButton = page.locator('input[name="password"] + svg');
		const showConfirmPasswordButton = page.locator('input[name="confirmPassword"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getAttribute('input[name="confirmPassword"]', 'type')) === 'password');
		await showPasswordButton.click();

		await showConfirmPasswordButton.click();
		assert.assert((await page.getAttribute('input[name="password"]', 'type')) === 'password');
	});

	test('Show error returned by the server when submitting form with existing email', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));
		const alreadyRegisteredUsed = await User.create({ email: 'test@test.fr', password: 'Test123!' });

		await alreadyRegisteredUsed.save();

		await page.fill('input[name="email"]', alreadyRegisteredUsed.email);
		await page.fill('input[name="password"]', alreadyRegisteredUsed.password);
		await page.fill('input[name="confirmPassword"]', alreadyRegisteredUsed.password);
		await page.click('button[type="submit"]');
		await page.waitForSelector('.toast');

		await page.assertVisible(page.getByText('The email has already been taken'));
		await page.assertVisible(page.getByText('An error occurred while creating your account'));
	});

	test('Show confirmation message returned by the server when submitting the form', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.fill('input[name="email"]', 'test@test.fr');
		await page.fill('input[name="password"]', 'Test123!');
		await page.fill('input[name="confirmPassword"]', 'Test123!');
		await page.click('button[type="submit"]');
		await page.waitForURL(route('home'));

		await page.assertVisible(page.getByText('Account created successfully'));
	});

	test('Home page show register button when not logged in', async ({ visit, route }) => {
		const page = await visit(route('home'));

		await page.assertExists(`a[href="${route('auth.register')}"]`);

		await page.click(`a[href="${route('auth.register')}"]`);
		await page.waitForURL(route('auth.register'));

		await page.assertUrlContains(route('auth.register'));
	});

	test("Home page don't show register button when logged in", async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.fill('input[name="email"]', 'test@test.fr');
		await page.fill('input[name="password"]', 'Test123!');
		await page.fill('input[name="confirmPassword"]', 'Test123!');
		await page.click('button[type="submit"]');
		await page.waitForURL(route('home'));

		await page.assertNotExists(page.getByRole('link', { name: 'Register' }));
	});
});
