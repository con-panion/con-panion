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

router.on('/').renderInertia('home').as('home');
router.get('/register', [RegisterController, 'render']).middleware(middleware.guest());
router.post('/register', [RegisterController]).as('auth.register');
router.get('/login', [LoginController, 'render']).middleware(middleware.guest());
router.post('/login', [LoginController]).as('auth.login');
router.delete('/logout', [LogoutController]).as('auth.logout');
router.get('/verify-email/:email', [VerifyEmailController]).as('auth.verify-email');
router.post('/verify-email/resend', [VerifyEmailController, 'resend']).as('auth.verify-email.resend');
