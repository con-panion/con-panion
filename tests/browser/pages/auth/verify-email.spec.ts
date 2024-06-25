import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import VerifyEmailService from '#services/verify-email-service';
import { timeTravel } from '#test-helpers/time-travel';

test.group('Auth verify email', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Verify email without token page show error message and redirects to /login', async ({ visit, route }) => {
		const page = await visit(route('auth.verify-email', { token: '' }));

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Verify email token missing'));
	});

	test('Verify email with invalid token page show error message and redirects to /login', async ({ visit, route }) => {
		const page = await visit(route('auth.verify-email', { token: 'invalid-token' }));

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verify email token'));
	});

	test('Verify email with expired token page show error message and redirects to /login', async ({ visit, route }) => {
		hash.fake();

		const verifyEmailService = new VerifyEmailService();
		const user = await UserFactory.create();
		const token = await verifyEmailService.generateToken(user);

		timeTravel('1d');

		const page = await visit(route('auth.verify-email', { token }));

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verify email token'));

		hash.restore();
	});

	test('Verify email with old token page show error message and redirects to /login', async ({ visit, route }) => {
		hash.fake();

		const verifyEmailService = new VerifyEmailService();
		const user = await UserFactory.create();
		const token = await verifyEmailService.generateToken(user);

		await verifyEmailService.generateToken(user);

		const page = await visit(route('auth.verify-email', { token }));

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verify email token'));

		hash.restore();
	});

	test('Verify email with used token page show error message and redirects to /login', async ({
		client,
		visit,
		route,
	}) => {
		hash.fake();

		const verifyEmailService = new VerifyEmailService();
		const user = await UserFactory.create();
		const token = await verifyEmailService.generateToken(user);

		await client.post(route('auth.verify-email', { token })).withCsrfToken().withInertia();

		const page = await visit(route('auth.verify-email', { token }));

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verify email token'));

		hash.restore();
	});

	test('Verify email with valid token page show verify email form', async ({ assert, visit, route }) => {
		hash.fake();

		const verifyEmailService = new VerifyEmailService();
		const user = await UserFactory.create();
		const token = await verifyEmailService.generateToken(user);
		const page = await visit(route('auth.verify-email', { token }));

		await page.assertPath(route('auth.verify-email', { token }));

		const body = await page.innerHTML('#app');

		assert.snapshot(body.trim()).match();

		hash.restore();
	});

	test('Show confirmation message when clicking verify button', async ({ visit, route }) => {
		hash.fake();

		const verifyEmailService = new VerifyEmailService();
		const user = await UserFactory.create();
		const token = await verifyEmailService.generateToken(user);
		const page = await visit(route('auth.verify-email', { token }));

		await page.getByRole('button', { name: 'Verify Email' }).click();
		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="success"]');

		await page.assertVisible(page.getByText('Your email has been successfully verified'));

		hash.restore();
	});

	test('Send email verification email when clicking on resend email button on verify email notification', async ({
		visit,
		route,
	}) => {
		hash.fake();

		const { mails } = mail.fake();

		const user = await User.create({ email: 'test@test.fr', password: 'Test123!', isVerified: false });

		await user.save();

		const page = await visit(route('auth.login'));

		await page.getByLabel('Email').fill(user.email);
		await page.getByLabel('Password').fill('Test123!');
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForSelector('.toast[data-type="info"]');

		await page.getByRole('button', { name: 'Resend email' }).click();
		await page.waitForNavigation();

		mails.assertQueued(VerifyEmailNotification);

		hash.restore();
	});
});
