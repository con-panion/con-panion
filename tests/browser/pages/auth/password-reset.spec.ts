import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { UserFactory } from '#database/factories/user-factory';
import PasswordResetService from '#services/password-reset-service';
import { timeTravel } from '#test-helpers/time-travel';

test.group('Auth password reset', (group) => {
	group.each.setup(() => testUtils.db().withGlobalTransaction());

	test('Password reset without token page show error message and redirects to /forgot-password', async ({
		visit,
		route,
	}) => {
		const page = await visit(route('auth.password-reset', { token: '' }));

		await page.waitForURL(route('auth.forgot-password'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Password reset token missing'));
	});

	test('Password reset with invalid token page show error message and redirects to /forgot-password', async ({
		visit,
		route,
	}) => {
		const page = await visit(route('auth.password-reset', { token: 'invalid-token' }));

		await page.waitForURL(route('auth.forgot-password'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired password reset token'));
	});

	test('Password reset with expired token page show error message and redirects to /forgot-password', async ({
		visit,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		timeTravel('1h');

		const page = await visit(route('auth.password-reset', { token }));

		await page.waitForURL(route('auth.forgot-password'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired password reset token'));

		hash.restore();
	});

	test('Password reset with old token page show error message and redirects to /forgot-password', async ({
		visit,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		await passwordResetService.generateToken(user);

		const page = await visit(route('auth.password-reset', { token }));

		await page.waitForURL(route('auth.forgot-password'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired password reset token'));

		hash.restore();
	});

	test('Password reset with used token page show error message and redirects to /forgot-password', async ({
		client,
		visit,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);

		await client
			.patch(route('auth.password-reset', { token }))
			.json({ password: 'Test123!', passwordConfirmation: 'Test123!' })
			.withCsrfToken()
			.withInertia();

		const page = await visit(route('auth.password-reset', { token }));

		await page.waitForURL(route('auth.forgot-password'));
		await page.waitForSelector('.toast[data-type="error"]');

		await page.assertVisible(page.getByText('Invalid or expired password reset token'));

		hash.restore();
	});

	test('Password reset with valid token page show password reset form', async ({ assert, visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));

		await page.assertPath(route('auth.password-reset', { token }));

		const body = await page.innerHTML('#app');

		assert.snapshot(body.trim()).match();

		hash.restore();
	});

	test('Submit button is not activated when the form is invalid', async ({ visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));
		const submitButton = page.getByRole('button', { name: 'Reset Password' });

		await page.assertDisabled(submitButton);

		await page.getByLabel(/^New password$/).fill('password');
		await page.getByLabel('Confirm new password').fill('not-the-same-password');
		await page.assertDisabled(submitButton);

		hash.restore();
	});

	test('Submit button is activated when the form is valid', async ({ visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));
		const submitButton = page.getByRole('button', { name: 'Reset Password' });

		await page.assertDisabled(submitButton);

		await page.getByLabel(/^New password$/).fill('Test123!');
		await page.getByLabel('Confirm new password').fill('Test123!');
		await page.assertNotDisabled(submitButton);

		hash.restore();
	});

	test('Show error message when form field is invalid', async ({ visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));

		await page.getByLabel(/^New password$/).fill('password');
		await page.assertVisible(page.getByText('The password field format is invalid'));

		await page.getByLabel('Confirm new password').fill('not-the-same-password');
		await page.assertVisible(page.getByText('The passwordConfirmation field and password field must be the same'));

		hash.restore();
	});

	test('Remove error message when form field is valid', async ({ visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));

		await page.getByLabel(/^New password$/).fill('password');
		await page.getByLabel(/^New password$/).fill('Test123!');
		await page.assertNotVisible(page.getByText('The password field format is invalid'));

		hash.restore();
	});

	test('Toggle password visibility when clicking on the eye icon', async ({ assert, visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));
		const showPasswordButton = page.locator('input[name="password"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel(/^New password$/).getAttribute('type')) === 'text');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel(/^New password$/).getAttribute('type')) === 'password');

		hash.restore();
	});

	test("Don't toggle password visibility when clicking on the eye icon for the other password field", async ({
		assert,
		visit,
		route,
	}) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));
		const showPasswordButton = page.locator('input[name="password"] + svg');
		const showConfirmPasswordButton = page.locator('input[name="passwordConfirmation"] + svg');

		await showPasswordButton.click();
		assert.assert((await page.getByLabel('Confirm new password').getAttribute('type')) === 'password');
		await showPasswordButton.click();

		await showConfirmPasswordButton.click();
		assert.assert((await page.getByLabel(/^New password$/).getAttribute('type')) === 'password');

		hash.restore();
	});

	test('Show confirmation message when submitting the form with valid password', async ({ visit, route }) => {
		hash.fake();

		const passwordResetService = new PasswordResetService();
		const user = await UserFactory.create();
		const token = await passwordResetService.generateToken(user);
		const page = await visit(route('auth.password-reset', { token }));

		await page.getByLabel(/^New password$/).fill('Test123!');
		await page.getByLabel('Confirm new password').fill('Test123!');
		await page.getByRole('button', { name: 'Reset Password' }).click();
		await page.waitForURL(route('auth.login'));
		await page.waitForSelector('.toast[data-type="success"]');

		await page.assertVisible(page.getByText('Your password has been successfully reset'));

		hash.restore();
	});
});
