/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';

import { middleware } from './kernel.js';

const RegisterController = () => import('#controllers/register-controller');
const LoginController = () => import('#controllers/login-controller');
const LogoutController = () => import('#controllers/logout-controller');
const VerifyEmailController = () => import('#controllers/verify-email-controller');
const PasswordResetController = () => import('#controllers/password-reset-controller');

router.on('/').renderInertia('home').as('home');

router.get('/register', [RegisterController, 'render']).middleware(middleware.guest());
router.post('/register', [RegisterController]).as('auth.register');

router.get('/login', [LoginController, 'render']).middleware(middleware.guest());
router.post('/login', [LoginController]).as('auth.login');

router.delete('/logout', [LogoutController]).as('auth.logout');

router.get('/verify-email', [VerifyEmailController, 'render']).middleware(middleware.guest());
router.get('/verify-email/:token', [VerifyEmailController, 'render']).middleware(middleware.guest());
router.post('/verify-email/resend', [VerifyEmailController, 'resend']).as('auth.verify-email.resend');
router.post('/verify-email', [VerifyEmailController]);
router.post('/verify-email/:token', [VerifyEmailController]).as('auth.verify-email');

router.get('/forgot-password', [PasswordResetController, 'forgot']).middleware(middleware.guest());
router.post('/forgot-password', [PasswordResetController, 'sendMail']).as('auth.forgot-password');
router.get('/password-reset', [PasswordResetController, 'reset']).middleware(middleware.guest());
router.get('/password-reset/:token', [PasswordResetController, 'reset']).middleware(middleware.guest());
router.patch('/password-reset', [PasswordResetController, 'update']);
router.patch('/password-reset/:token', [PasswordResetController, 'update']).as('auth.password-reset');
