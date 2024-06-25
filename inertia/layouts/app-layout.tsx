import { StrictMode } from 'react';

import { ThemeProvider } from 'next-themes';

import { Notifications } from '~/components/notifications';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<StrictMode>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				{children}
				<Notifications />
			</ThemeProvider>
		</StrictMode>
	);
}
