import { useEffect } from 'react';

import { router, usePage } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';
import { useForm } from 'react-hook-form';

import { NotificationType } from '#types/notification';
import { forgotPasswordSchema, type ForgotPasswordSchema } from '#validators/auth';

import { handleNotification } from '~/lib/handle-notification';
import { vineResolver } from '~/lib/vine-resolver';

import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export function ForgotPasswordForm() {
	const pageProps = usePage().props;

	const form = useForm<ForgotPasswordSchema>({
		mode: 'onChange',
		resolver: vineResolver(forgotPasswordSchema),
		defaultValues: {
			email: '',
		},
	});

	useEffect(() => {
		if (!('errors' in pageProps)) {
			return;
		}

		const { errors } = pageProps;
		const errorKeys = Object.keys(errors);

		for (const errorKey of errorKeys) {
			form.setError(errorKey as keyof ForgotPasswordSchema, { type: 'manual', message: errors[errorKey] });
		}
	}, [pageProps.errors]);

	function onSubmit(data: ForgotPasswordSchema) {
		router.post(route('auth.forgot-password').url, data, {
			onError: () => {
				handleNotification({
					type: NotificationType.Error,
					message: 'An error has occurred, please try again',
				});
			},
		});
	}

	const disableSubmit = !form.formState.isValid || Object.keys(form.formState.errors).length > 0;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
				<fieldset disabled={form.formState.isSubmitting}>
					<div className="grid gap-4">
						<div className="grid gap-2">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input className="w-full bg-muted text-base" required autoComplete="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<Button type="submit" className="mt-4 w-full" disabled={disableSubmit}>
							Reset Password
						</Button>
					</div>
				</fieldset>
			</form>
		</Form>
	);
}
