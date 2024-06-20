import hash from '@adonisjs/core/services/hash';
import router from '@adonisjs/core/services/router';
import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import VerifyEmailNotification from '#mails/verify-email-notification';
import User from '#models/user';
import env from '#start/env';
import { timeTravel } from '#test-helpers/time-travel';

test.group('Auth verify email', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Show error notification when verifying email with incomplete signature', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: false,
		});

		await user.save();

		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			})
			.slice(0, -2);
		const page = await visit(verifyEmailUrl);

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verification link'));

		hash.restore();
	});

	test('Show error notification when verifying email with expired signature', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: false,
		});

		await user.save();

		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});

		timeTravel('1d');

		const page = await visit(verifyEmailUrl);

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired verification link'));

		hash.restore();
	});

	test('Show error notification when verifying email with unknown email', async ({ visit, route }) => {
		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: 'wrong@email.fr' })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const page = await visit(verifyEmailUrl);

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('User not found'));
	});

	test('Show error notification when verifying email with verified user', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: true,
		});

		await user.save();

		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const page = await visit(verifyEmailUrl);

		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Your email has already been verified'));

		hash.restore();
	});

	test('Show success notification when verifying email with valid signature', async ({ visit, route }) => {
		hash.fake();

		const user = await User.create({
			email: 'test@test.fr',
			password: 'Test123!',
			isVerified: false,
		});

		await user.save();

		const verifyEmailUrl = router
			.builder()
			.prefixUrl(env.get('APP_URL'))
			.params({ email: user.email })
			.makeSigned('auth.verify-email', {
				expiresIn: '1d',
				purpose: 'verify-email',
			});
		const page = await visit(verifyEmailUrl);

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

		mails.assertSent(VerifyEmailNotification);

		hash.restore();
	});
});
