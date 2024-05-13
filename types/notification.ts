export enum NotificationType {
	Success = 'success',
	Error = 'error',
	Info = 'info',
	Warning = 'warning',
}

interface NotificationWithTitle {
	title: string;
	message: string;
}

interface NotificationWithoutTitle {
	type: NotificationType;
	message: string;
}

export type NotificationFlash = NotificationWithoutTitle | NotificationWithTitle;
