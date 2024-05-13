import { clsx, type ClassValue } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { NotificationType, type NotificationFlash } from '#types/notification';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function handleNotification(notification: NotificationFlash) {
	if ('title' in notification) {
		toast.message(notification.title, {
			description: notification.message,
		});

		return;
	}

	switch (notification.type) {
		case NotificationType.Success: {
			toast.success(notification.message);
			break;
		}

		case NotificationType.Error: {
			toast.error(notification.message);
			break;
		}

		case NotificationType.Info: {
			toast.info(notification.message);
			break;
		}

		case NotificationType.Warning: {
			toast.warning(notification.message);
			break;
		}

		default: {
			break;
		}
	}
}
