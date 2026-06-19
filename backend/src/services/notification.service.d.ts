export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    WHATSAPP = "WHATSAPP"
}
export interface NotificationPayload {
    to: string;
    subject?: string;
    body: string;
    attachments?: any[];
}
/**
 * Generic notification sender that routes the notification to the correct platform
 */
export declare const sendNotification: (type: NotificationType, payload: NotificationPayload) => Promise<{
    success: boolean;
    messageId: string;
} | {
    status: string;
    message: string;
}>;
//# sourceMappingURL=notification.service.d.ts.map