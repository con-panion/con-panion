import { useEffect, useState } from 'react';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

import { NotificationType } from '#types/notification';
import { loginValidator, type LoginSchema } from '#validators/auth';

import { handleNotification } from '~/lib/utils';
import { vineResolver } from '~/lib/vine-resolver';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export function LoginForm() {
	const pageProps = usePage().props;

	const form = useForm<LoginSchema>({
		mode: 'onChange',
		resolver: vineResolver(loginValidator),
		defaultValues: {
			email: '',
			password: '',
			rememberMe: false,
		},
	});

	const [isPasswordHidden, setPasswordHidden] = useState(true);

	useEffect(() => {
		if (!('errors' in pageProps)) {
			return;
		}

		const { errors } = pageProps;
		const errorKeys = Object.keys(errors);

		for (const errorKey of errorKeys) {
			form.setError(errorKey as keyof LoginSchema, { type: 'manual', message: errors[errorKey] });
		}
	}, [pageProps.errors]);

	function onSubmit(data: LoginSchema) {
		router.post('/login', data, {
			onError: () => {
				handleNotification({
					type: NotificationType.Error,
					message: 'An error has occurred while logging in to your account',
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
								name="rememberMe"
								render={({ field }) => (
									<FormItem className="flex space-x-2 space-y-0">
										<FormControl>
											<Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<FormLabel className="text-xs font-normal">Remember me</FormLabel>
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-2">
							<Link href="#" className="ml-auto inline-block text-sm underline">
								Forgot your password?
							</Link>
						</div>
						<Button type="submit" className="mt-4 w-full" disabled={disableSubmit}>
							Login
						</Button>
					</div>
				</fieldset>
			</form>
		</Form>
	);
}
