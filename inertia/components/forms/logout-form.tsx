import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

import { Button } from '../ui/button';
import { Form } from '../ui/form';

export function LogoutForm() {
	const form = useForm();

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(() => router.delete('/logout'))} className="w-full">
				<Button type="submit" variant="link">
					Logout
				</Button>
			</form>
		</Form>
	);
}
