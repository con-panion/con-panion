import '../css/app.css';

import { resolvePageComponent } from '@adonisjs/inertia/helpers';
import { createInertiaApp } from '@inertiajs/react';
import { hydrateRoot } from 'react-dom/client';

const appName = (import.meta.env.VITE_APP_NAME as string) || 'con-panion';

createInertiaApp({
	progress: { color: '#5468FF' },

	title: (title) => (title ? `${title} - ${appName}` : appName),

	resolve: (name) => resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx')),

	setup({ el, App, props }) {
		hydrateRoot(el, <App {...props} />);
	},
});
