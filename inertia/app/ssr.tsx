import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider } from 'next-themes';
import ReactDOMServer from 'react-dom/server';

export default function render(page: string) {
	return createInertiaApp({
		page,
		render: ReactDOMServer.renderToString,
		resolve: (name: string) => {
			const pages = import.meta.glob('../pages/**/*.tsx', { eager: true });

			return pages[`../pages/${name}.tsx`];
		},
		setup: ({ App, props }) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				<App {...props} />
			</ThemeProvider>
		),
	});
}
