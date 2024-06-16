import { StrictMode } from 'react';

import { ThemeProvider } from 'next-themes';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<StrictMode>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				{children}
			</ThemeProvider>
		</StrictMode>
	);
}
