import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import User from '#models/user';

test.group('Auth register', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Register page show register form', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.assertPath(route('auth.register'));

		const body = await page.innerHTML('body');

		assert.snapshot(body.trim()).match();
	});

	test('Submit button is not activated when the form is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));
		const submitButton = page.getByRole('button', { name: 'Create an account' });

		await page.assertDisabled(submitButton);

		await page.getByLabel('Email').fill('not-an-email');
		await page.getByLabel(/^Password$/).fill('password');
		await page.getByLabel('Confirm password').fill('not-the-same-password');
		await page.assertDisabled(submitButton);
	});

	test('Submit button is activated when the form is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));
		const submitButton = page.getByRole('button', { name: 'Create an account' });

		await page.assertDisabled(submitButton);

		await page.getByLabel('Email').fill('test@test.fr');
		await page.getByLabel(/^Password$/).fill('Test123!');
		await page.getByLabel('Confirm password').fill('Test123!');
		await page.assertNotDisabled(submitButton);
	});

	test('Show error message when form field is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.getByLabel('Email').fill('not-an-email');
		await page.assertVisible(page.getByText('The email field must be a valid email address'));

		await page.getByLabel(/^Password$/).fill('password');
		await page.assertVisible(page.getByText('The password field format is invalid'));

		await page.getByLabel('Confirm password').fill('not-the-same-password');
		await page.assertVisible(page.getByText('The confirmPassword field and password field must be the same'));
	});

	test('Remove error message when form field is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.register'));

		await page.getByLabel('Email').fill('not-an-email');
		await page.getByLabel('Email').fill('test@test.fr');
		await page.assertNotVisible(page.getByText('The email field must be a valid email address'));
	});

	test('Toggle password visibility when clicking on the eye icon', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.register'));
		const showPasswordButton = page.locator('input[name="password"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel(/^Password$/).getAttribute('type')) === 'text');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel(/^Password$/).getAttribute('type')) === 'password');
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
		assert.assert((await page.getByLabel('Confirm password').getAttribute('type')) === 'password');
		await showPasswordButton.click();

		await showConfirmPasswordButton.click();
		assert.assert((await page.getByLabel(/^Password$/).getAttribute('type')) === 'password');
	});

	test('Show error returned by the server when submitting form with existing email', async ({ visit, route }) => {
		hash.fake();

		const alreadyRegisteredUser = await User.create({ email: 'test@test.fr', password: 'Test123!' });

		await alreadyRegisteredUser.save();

		const page = await visit(route('auth.register'));

		await page.getByLabel('Email').fill(alreadyRegisteredUser.email);
		await page.getByLabel(/^Password$/).fill('Test123!');
		await page.getByLabel('Confirm password').fill('Test123!');
		await page.getByRole('button', { name: 'Create an account' }).click();
		await page.waitForSelector('.toast');

		await page.assertVisible(page.getByText('The email has already been taken'));
		await page.assertVisible(page.getByText('An error occurred while creating your account'));

		hash.restore();
	});

	test('Show confirmation message returned by the server when submitting the form', async ({ visit, route }) => {
		hash.fake();

		const page = await visit(route('auth.register'));

		await page.getByLabel('Email').fill('test@test.fr');
		await page.getByLabel(/^Password$/).fill('Test123!');
		await page.getByLabel('Confirm password').fill('Test123!');
		await page.getByRole('button', { name: 'Create an account' }).click();
		await page.waitForURL(route('home'));

		await page.assertVisible(page.getByText('Account created successfully'));

		hash.restore();
	});

	test('Home page show register button when not logged in', async ({ visit, route }) => {
		const page = await visit(route('home'));
		const registerLink = page.getByRole('link', { name: 'Register' });

		await page.assertExists(registerLink);

		await registerLink.click();
		await page.waitForURL(route('auth.register'));

		await page.assertUrlContains(route('auth.register'));
	});

	test("Home page don't show register button when logged in", async ({ visit, route }) => {
		hash.fake();

		const page = await visit(route('auth.register'));

		await page.getByLabel('Email').fill('test@test.fr');
		await page.getByLabel(/^Password$/).fill('Test123!');
		await page.getByLabel('Confirm password').fill('Test123!');
		await page.getByRole('button', { name: 'Create an account' }).click();
		await page.waitForURL(route('home'));

		await page.assertNotExists(page.getByRole('link', { name: 'Register' }));

		hash.restore();
	});
});
