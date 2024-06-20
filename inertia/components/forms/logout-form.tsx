import { router } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';
import { useForm } from 'react-hook-form';

import { Button } from '../ui/button';
import { Form } from '../ui/form';

export function LogoutForm() {
	const form = useForm();

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(() => router.delete(route('auth.logout').url))} className="w-full">
				<Button type="submit" variant="link">
					Logout
				</Button>
			</form>
		</Form>
	);
}
