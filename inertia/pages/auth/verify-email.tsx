import type { InferPageProps } from '@adonisjs/inertia/types';
import { router } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';

import type VerifyEmailController from '#controllers/verify-email-controller';
import { NotificationType } from '#types/notification';

import { Notifications } from '~/components/notifications';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { handleNotification } from '~/lib/handle-notification';

export default function VerifyEmail({ token }: InferPageProps<VerifyEmailController, 'render'>) {
	function verify() {
		router.post(
			route('auth.verify-email', { params: { token } }).url,
			{},
			{
				onError: () => {
					handleNotification({ type: NotificationType.Error, message: 'An error has occurred, please try again' });
				},
			},
		);
	}

	return (
		<>
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Verify Email</CardTitle>
					<CardDescription>Click on the button below to verify you email</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onClick={verify} className="btn btn-primary">
						Verify Email
					</Button>
				</CardContent>
			</Card>
			<Notifications />
		</>
	);
}
