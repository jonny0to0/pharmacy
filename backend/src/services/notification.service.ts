import { sendEmail } from "./email.service.js";
// import { sendSms } from "./sms.service.js"; // Future implementation
// import { sendWhatsApp } from "./whatsapp.service.js"; // Future implementation

export enum NotificationType {
  EMAIL = "EMAIL",
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
}

export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  attachments?: any[]; // Allow sending email attachments, like PDFs
}

/**
 * Generic notification sender that routes the notification to the correct platform
 */
export const sendNotification = async (
  type: NotificationType,
  payload: NotificationPayload
) => {
  try {
    switch (type) {
      case NotificationType.EMAIL:
        if (!payload.subject) {
          throw new Error("Subject is required for EMAIL notifications.");
        }
        return await sendEmail(payload.to, payload.subject, payload.body, payload.attachments);
      
      case NotificationType.SMS:
        // return await sendSms(payload.to, payload.body);
        console.warn("SMS service is not yet implemented. Logging payload:", payload);
        return { status: "mocked", message: "SMS mocked" };
      
      case NotificationType.WHATSAPP:
        // return await sendWhatsApp(payload.to, payload.body);
        console.warn("WhatsApp service is not yet implemented. Logging payload:", payload);
        return { status: "mocked", message: "WhatsApp mocked" };
        
      default:
        throw new Error(`Unsupported Notification Type: ${type}`);
    }
  } catch (error) {
    console.error(`[NotificationService] Error sending ${type}:`, error);
    throw error;
  }
};
