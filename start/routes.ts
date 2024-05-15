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

router.on('/').renderInertia('home').as('home');
router.get('/register', [RegisterController, 'render']).middleware(middleware.guest());
router.post('/register', [RegisterController]).as('auth.register');
router.get('/login', [LoginController, 'render']).middleware(middleware.guest());
router.post('/login', [LoginController]).as('auth.login');
