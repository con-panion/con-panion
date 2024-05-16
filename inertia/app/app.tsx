import '../css/app.css';

import { StrictMode } from 'react';

import { resolvePageComponent } from '@adonisjs/inertia/helpers';
import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider } from 'next-themes';
import { hydrateRoot } from 'react-dom/client';

const appName = (import.meta.env.VITE_APP_NAME as string) || 'con-panion';

createInertiaApp({
	progress: { color: '#5468FF' },

	title: (title) => (title ? `${title} - ${appName}` : appName),

	resolve: (name) => resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx')),

	setup({ el, App, props }) {
		hydrateRoot(
			el,
			<StrictMode>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<App {...props} />
				</ThemeProvider>
			</StrictMode>,
		);
	},
});
