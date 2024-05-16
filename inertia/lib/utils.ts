import { clsx, type ClassValue } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { NotificationType, type NotificationFlash } from '#types/notification';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function handleNotification(notification: NotificationFlash) {
	if ('title' in notification) {
		return toast.message(notification.title, {
			description: notification.message,
		});
	}

	switch (notification.type) {
		case NotificationType.Success: {
			return toast.success(notification.message);
		}

		case NotificationType.Error: {
			return toast.error(notification.message);
		}

		case NotificationType.Info: {
			return toast.info(notification.message);
		}

		case NotificationType.Warning: {
			return toast.warning(notification.message);
		}

		default: {
			break;
		}
	}
}
