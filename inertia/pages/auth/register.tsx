import { Link } from '@inertiajs/react';

import { RegisterForm } from '~/components/forms/register-form';
import { Notifications } from '~/components/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

export default function Register() {
	return (
		<>
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Sign Up</CardTitle>
					<CardDescription>Enter your information to create an account</CardDescription>
				</CardHeader>
				<CardContent>
					<RegisterForm />
					<div className="mt-4 text-center text-sm">
						Already have an account?{' '}
						<Link href="#" className="underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
			<Notifications />
		</>
	);
}
