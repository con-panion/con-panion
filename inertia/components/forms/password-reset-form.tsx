import { useEffect, useState } from 'react';

import type { InferPageProps } from '@adonisjs/inertia/types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';
import { useForm } from 'react-hook-form';

import type PasswordResetController from '#controllers/password-reset-controller';
import { NotificationType } from '#types/notification';
import { passwordResetValidator, type PasswordResetSchema } from '#validators/auth';

import { handleNotification } from '~/lib/handle-notification';
import { vineResolver } from '~/lib/vine-resolver';

import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export function PasswordResetForm({ token }: InferPageProps<PasswordResetController, 'reset'>) {
	const pageProps = usePage().props;

	const form = useForm<PasswordResetSchema>({
		mode: 'onChange',
		resolver: vineResolver(passwordResetValidator),
		defaultValues: {
			password: '',
			passwordConfirmation: '',
		},
	});

	const [isPasswordHidden, setPasswordHidden] = useState(true);
	const [isPasswordConfirmationHidden, setPasswordConfirmationHidden] = useState(true);

	useEffect(() => {
		if (!('errors' in pageProps)) {
			return;
		}

		const { errors } = pageProps;
		const errorKeys = Object.keys(errors);

		for (const errorKey of errorKeys) {
			form.setError(errorKey as keyof PasswordResetSchema, { type: 'manual', message: errors[errorKey] });
		}
	}, [pageProps.errors]);

	function onSubmit(data: PasswordResetSchema) {
		router.patch(route('auth.password-reset', { params: { token } }).url, data, {
			onError: () => {
				handleNotification({ type: NotificationType.Error, message: 'An error has occurred, please try again' });
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
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New password</FormLabel>
										<div className="relative">
											<FormControl>
												<Input
													className="w-full bg-muted text-base"
													required
													type={isPasswordHidden ? 'password' : 'text'}
													placeholder="********"
													autoComplete="new-password"
													{...field}
												/>
											</FormControl>
											{!isPasswordHidden && (
												<EyeIcon
													onClick={() => setPasswordHidden(true)}
													className="absolute right-2 top-[9px] h-5 w-5 opacity-50"
												/>
											)}
											{isPasswordHidden && (
												<EyeSlashIcon
													onClick={() => setPasswordHidden(false)}
													className="absolute right-2 top-[9px] h-5 w-5 opacity-50"
												/>
											)}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-2">
							<FormField
								control={form.control}
								name="passwordConfirmation"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm new password</FormLabel>
										<div className="relative w-full">
											<FormControl>
												<Input
													className="w-full bg-muted text-base"
													required
													type={isPasswordConfirmationHidden ? 'password' : 'text'}
													placeholder="Repeat your password"
													autoComplete="new-password"
													{...field}
												/>
											</FormControl>
											{!isPasswordConfirmationHidden && (
												<EyeIcon
													onClick={() => setPasswordConfirmationHidden(true)}
													className="absolute inset-y-1/2 right-2 h-5 w-5 -translate-y-1/2 cursor-pointer opacity-50"
												/>
											)}
											{isPasswordConfirmationHidden && (
												<EyeSlashIcon
													onClick={() => setPasswordConfirmationHidden(false)}
													className="absolute inset-y-1/2 right-2 h-5 w-5 -translate-y-1/2 cursor-pointer opacity-50"
												/>
											)}
										</div>
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
