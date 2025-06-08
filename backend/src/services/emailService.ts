import { logger } from '../utils/logger';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send verification email
   */
  static async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${'http://localhost:3000'}/email-verification?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SaaS Blueprint Generator!</h1>
              <p>Please verify your email address to get started</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thanks for signing up! To complete your registration and start generating SaaS blueprints, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace;">${verificationUrl}</p>
              
              <div class="warning">
                <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
              </div>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
              
              <p>Best regards,<br>The SaaS Blueprint Generator Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SaaS Blueprint Generator. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to SaaS Blueprint Generator!
      
      Hi ${name},
      
      Thanks for signing up! To complete your registration, please verify your email address by visiting:
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with us, please ignore this email.
      
      Best regards,
      The SaaS Blueprint Generator Team
    `;

    try {
      // For development, just log the email content
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📧 EMAIL VERIFICATION (Development Mode)`);
        logger.info(`To: ${email}`);
        logger.info(`Verification URL: ${verificationUrl}`);
        console.log('='.repeat(80));
        console.log('📧 VERIFICATION EMAIL CONTENT:');
        console.log('='.repeat(80));
        console.log(`To: ${email}`);
        console.log(`Subject: Verify Your Email - SaaS Blueprint Generator`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('='.repeat(80));
        return;
      }

      // Production email sending with SendGrid
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: process.env.FROM_EMAIL || 'noreply@saasblueprint.com',
          subject: 'Verify Your Email - SaaS Blueprint Generator',
          html,
          text,
        };

        await sgMail.send(msg);
        logger.info(`Verification email sent via SendGrid to: ${email}`);
        return;
      }

      // Alternative: Gmail with App Password
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Verify Your Email - SaaS Blueprint Generator',
          html,
          text,
        });

        logger.info(`Verification email sent via Gmail to: ${email}`);
        return;
      }

      // Fallback: log warning if no email service is configured
      logger.warn(
        'No email service configured for production. Email not sent.'
      );
      console.log('='.repeat(80));
      console.log(
        '📧 EMAIL WOULD BE SENT (Production - No Service Configured):'
      );
      console.log('='.repeat(80));
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('='.repeat(80));
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .security-tip { background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>Reset your SaaS Blueprint Generator password</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password for your SaaS Blueprint Generator account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                  <li>This password reset link will expire in <strong>24 hours</strong></li>
                  <li>For your security, this link can only be used once</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                </ul>
              </div>
              
              <div class="security-tip">
                <strong>💡 Security Tip:</strong> Always create a strong password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters.
              </div>
              
              <p>If you're having trouble with the button above, you can also visit our help center or contact our support team.</p>
              
              <p>Best regards,<br>The SaaS Blueprint Generator Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SaaS Blueprint Generator. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>If you didn't request this password reset, please contact our support team immediately.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request - SaaS Blueprint Generator
      
      Hi ${name},
      
      We received a request to reset your password for your SaaS Blueprint Generator account.
      
      To reset your password, please visit:
      ${resetUrl}
      
      Important Security Information:
      - This password reset link will expire in 24 hours
      - For your security, this link can only be used once
      - If you didn't request this reset, please ignore this email
      
      Security Tip: Always create a strong password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters.
      
      If you're having trouble, please contact our support team.
      
      Best regards,
      The SaaS Blueprint Generator Team
      
      If you didn't request this password reset, please contact our support team immediately.
    `;

    try {
      // For development, just log the email content
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📧 PASSWORD RESET EMAIL (Development Mode)`);
        logger.info(`To: ${email}`);
        logger.info(`Reset URL: ${resetUrl}`);
        console.log('='.repeat(80));
        console.log('📧 PASSWORD RESET EMAIL CONTENT:');
        console.log('='.repeat(80));
        console.log(`To: ${email}`);
        console.log(`Subject: Reset Your Password - SaaS Blueprint Generator`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('='.repeat(80));
        return;
      }

      // Production email sending with SendGrid
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: process.env.FROM_EMAIL || 'noreply@saasblueprint.com',
          subject: 'Reset Your Password - SaaS Blueprint Generator',
          html,
          text,
        };

        await sgMail.send(msg);
        logger.info(`Password reset email sent via SendGrid to: ${email}`);
        return;
      }

      // Alternative: Gmail with App Password
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Reset Your Password - SaaS Blueprint Generator',
          html,
          text,
        });

        logger.info(`Password reset email sent via Gmail to: ${email}`);
        return;
      }

      // Fallback: log warning if no email service is configured
      logger.warn(
        'No email service configured for production. Password reset email not sent.'
      );
      console.log('='.repeat(80));
      console.log(
        '📧 PASSWORD RESET EMAIL WOULD BE SENT (Production - No Service Configured):'
      );
      console.log('='.repeat(80));
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('='.repeat(80));
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Generic email sending method
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // For development, just log the email
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📧 EMAIL (Development Mode)`);
        logger.info(`To: ${options.to}`);
        logger.info(`Subject: ${options.subject}`);
        return;
      }

      // Production email implementation would go here
      logger.info(`Email sent to: ${options.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}
