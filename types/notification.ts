export enum NotificationType {
	Success = 'success',
	Error = 'error',
	Info = 'info',
	Warning = 'warning',
}

interface Notification {
	type: NotificationType;
	message: string;
}

export interface NotificationWithAction extends Notification {
	actionLabel: string;
	actionUrl?: string;
	actionBody?: Record<string, string>;
}

export type NotificationFlash = Notification | NotificationWithAction;
