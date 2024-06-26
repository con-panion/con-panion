import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import User from '#models/user';
import { timeTravel } from '#test-helpers/time-travel';

test.group('Auth login', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Login page show login form', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.login'));

		await page.assertPath(route('auth.login'));

		const body = await page.innerHTML('body');

		assert.snapshot(body.trim()).match();
	});

	test('Submit button is not activated when the form is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.login'));
		const submitButton = page.getByRole('button', { name: 'Login' });

		await page.assertDisabled(submitButton);

		await page.getByLabel('Email').fill('not-an-email');
		await page.getByLabel('Password').fill('password');
		await page.assertDisabled(submitButton);
	});

	test('Submit button is activated when the form is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.login'));
		const submitButton = page.getByRole('button', { name: 'Login' });

		await page.assertDisabled(submitButton);

		await page.getByLabel('Email').fill('test@test.fr');
		await page.getByLabel('Password').fill('Test123!');
		await page.assertNotDisabled(submitButton);
	});

	test('Show error message when form field is invalid', async ({ visit, route }) => {
		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill('not-an-email');
		await page.assertVisible(page.getByText('The email field must be a valid email address'));

		await page.getByLabel('Password').fill('Test123!');
		await page.getByLabel('Password').fill('');
		await page.assertVisible(page.getByText('The password field must have at least 1 characters'));
	});

	test('Remove error message when form field is valid', async ({ visit, route }) => {
		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill('not-an-email');
		await page.getByLabel('Email').fill('test@test.fr');
		await page.assertNotVisible(page.getByText('The email field must be a valid email address'));
	});

	test('Toggle password visibility when clicking on the eye icon', async ({ assert, visit, route }) => {
		const page = await visit(route('auth.login'));
		const showPasswordButton = page.locator('input[name="password"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel('Password').getAttribute('type')) === 'text');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel('Password').getAttribute('type')) === 'password');
	});

	test('Show error message when submitting form with invalid credentials', async ({ visit, route }) => {
		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill('test@test.fr');
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid user credentials'));
	});

	test('Show verify email message when submitting the form with unverified user', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!', isVerified: false });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="info"]');

		await page.assertVisible(page.getByText('Please check your email to verify your account'));
		await page.assertVisible(page.getByRole('button', { name: 'Resend email' }));

		hash.restore();
	});

	test('Show confirmation message when submitting the form with verified user', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!', isVerified: true });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('home'));
		await page.waitForSelector('.toast[data-type="success"]');

		await page.assertVisible(page.getByText('You have been logged in successfully'));

		hash.restore();
	});

	test('Home page show login button when not logged in', async ({ visit, route }) => {
		const page = await visit(route('home'));
		const loginLink = page.getByRole('link', { name: 'Login' });

		await page.assertExists(loginLink);

		await loginLink.click();
		await page.waitForURL(route('auth.login'));

		await page.assertUrlContains(route('auth.login'));
	});

	test("Home page don't show login button when logged in", async ({ visit, route, browserContext }) => {
		hash.fake();

		const user = await UserFactory.apply('verified').create();

		await browserContext.loginAs(user);

		const page = await visit(route('home'));

		await page.assertNotExists(page.getByRole('link', { name: 'Login' }));

		hash.restore();
	});

	test('Don\'t recover session when logged in with "remember me" not checked', async ({
		browserContext,
		visit,
		route,
	}) => {
		hash.fake();

		const user = await UserFactory.apply('verified').create();

		await browserContext.loginAs(user);

		const homePage = await visit(route('home'));

		await browserContext.setCookie('adonis-session', '', { domain: 'localhost' });
		await homePage.reload();

		await homePage.assertExists(homePage.getByRole('link', { name: 'Login' }));

		hash.restore();
	});

	test('Recover session when logged in with "remember me" checked', async ({ browserContext, visit, route }) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!', isVerified: true });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByLabel('Remember me').click();
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('home'));

		await browserContext.setCookie('adonis-session', '', { domain: 'localhost' });

		const homePage = await visit(route('home'));

		await homePage.assertNotExists(homePage.getByRole('link', { name: 'Login' }));

		hash.restore();
	});

	test('Don\'t recover session when logged in with "remember me" checked but cookie is expired', async ({
		browserContext,
		visit,
		route,
	}) => {
		hash.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!', isVerified: true });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByLabel('Remember me').click();
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL(route('home'));

		timeTravel('1 year');

		await browserContext.setCookie('adonis-session', '', { domain: 'localhost' });

		const homePage = await visit(route('home'));

		await homePage.assertExists(homePage.getByRole('link', { name: 'Login' }));

		hash.restore();
	});
});
