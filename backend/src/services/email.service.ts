import nodemailer from "nodemailer";

/**
 * Configure standard Nodemailer transport over SMTP.
 * For production, Gmail OAuth2 or a reliable SMTP provider (SendGrid, SES, Mailgun) is recommended.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., "your.email@gmail.com"
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "") : undefined, // Recommend using App Passwords if using basic Auth
  },
});

/**
 * Sends an invitation email to a new staff member.
 */
export const sendInvitationEmail = async (
  to: string,
  name: string,
  token: string,
  businessName: string
) => {
  const setupUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-account?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Medisynex</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Pharmacy Billing & Inventory System</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 16px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Welcome to the Team, ${name}!</h2>
        <p style="color: #475569; line-height: 1.6;">
          You have been invited to join <strong>${businessName}</strong> on Medisynex. 
          To get started and set up your account, please click the button below:
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${setupUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Setup Your Account
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 13px; font-style: italic;">
          This link will expire in 24 hours. If you did not expect this invitation, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 12px;">
        <p>&copy; 2026 Medisynex. All rights reserved.</p>
        <p>This is an automated system email. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail(to, `Invitation to join ${businessName} on Medisynex`, htmlContent);
};

/**
 * Sends an email
 */
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: any[]
) => {
  try {
    const mailOptions = {
      from: `"Medisynex" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    throw error;
  }
};
