import { useEffect, useState } from 'react';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

import { NotificationType } from '#types/notification';
import { registerSchema, type RegisterSchema } from '#validators/auth';

import { handleNotification } from '~/lib/utils';
import { vineResolver } from '~/lib/vine-resolver';

import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export function RegisterForm() {
	const pageProps = usePage().props;

	const form = useForm<RegisterSchema>({
		mode: 'onChange',
		resolver: vineResolver(registerSchema(false)),
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
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
			form.setError(errorKey as keyof RegisterSchema, { type: 'manual', message: errors[errorKey] });
		}
	}, [pageProps.errors]);

	function onSubmit(data: RegisterSchema) {
		router.post('/register', data, {
			onError: () => {
				handleNotification({ type: NotificationType.Error, message: 'An error occurred while creating your account' });
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
						<div className="grid gap-2">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
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
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm password</FormLabel>
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
							Create an account
						</Button>
					</div>
				</fieldset>
			</form>
		</Form>
	);
}