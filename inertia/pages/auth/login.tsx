import { Link } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';

import { LoginForm } from '~/components/forms/login-form';
import { Notifications } from '~/components/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

export default function Login() {
	return (
		<>
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>Enter your email below to login to your account</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{' '}
						<Link href={route('auth.register').url} className="underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
			<Notifications />
		</>
	);
}
