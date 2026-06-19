/**
 * Sends an invitation email to a new staff member.
 */
export declare const sendInvitationEmail: (to: string, name: string, token: string, businessName: string) => Promise<{
    success: boolean;
    messageId: string;
}>;
/**
 * Sends an email
 */
export declare const sendEmail: (to: string, subject: string, htmlContent: string, attachments?: any[]) => Promise<{
    success: boolean;
    messageId: string;
}>;
//# sourceMappingURL=email.service.d.ts.map