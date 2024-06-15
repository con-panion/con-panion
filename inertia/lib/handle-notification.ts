import { router } from '@inertiajs/react';
import { toast } from 'sonner';

import { NotificationType, type NotificationFlash } from '#types/notification';

export function handleNotification(notification: NotificationFlash) {
	const options =
		'actionLabel' in notification
			? {
					action: {
						label: notification.actionLabel,
						onClick: () => {
							if (notification.actionUrl) {
								router.post(notification.actionUrl, notification.actionBody);
							}
						},
					},
				}
			: {};

	switch (notification.type) {
		case NotificationType.Success: {
			return toast.success(notification.message, options);
		}

		case NotificationType.Error: {
			return toast.error(notification.message, options);
		}

		case NotificationType.Info: {
			return toast.info(notification.message, options);
		}

		case NotificationType.Warning: {
			return toast.warning(notification.message, options);
		}

		default: {
			break;
		}
	}
}
