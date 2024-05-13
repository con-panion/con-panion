import { useEffect } from 'react';

import { usePage } from '@inertiajs/react';

import type { NotificationFlash } from '#types/notification';

import { handleNotification } from '~/lib/utils';

import { Toaster } from './ui/sonner';

export function Notifications() {
	const { notification } = usePage().props;

	useEffect(() => {
		if (notification) {
			handleNotification(notification as NotificationFlash);
		}
	}, [notification]);

	return <Toaster richColors closeButton />;
}
