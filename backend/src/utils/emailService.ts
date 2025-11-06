/**
 * Email Service
 * Handles sending emails for verification and password reset
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'; // true for 465, false for other ports
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  // If email is not configured, return null
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    return null;
  }

  // Create transporter if it doesn't exist
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    console.log(`✉️  Email service configured: ${EMAIL_USER} via ${EMAIL_HOST}:${EMAIL_PORT}`);
  }

  return transporter;
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationToken: string
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`✉️  [DEV MODE] Verification email would be sent to ${email}`);
    console.log(`   Token: ${verificationToken}`);
    console.log(`   Verify at: ${FRONTEND_URL}/verify-email?token=${verificationToken}`);
    return false;
  }

  const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - Joffre Card Game',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 Welcome to Joffre Card Game!</h1>
            </div>
            <div class="content">
              <h2>Hi ${username}!</h2>
              <p>Thank you for registering. Please verify your email address to activate your account.</p>
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${verificationLink}
              </p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Joffre Card Game - Multiplayer Trick Card Game</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Joffre Card Game!

Hi ${username}!

Thank you for registering. Please verify your email address to activate your account.

Verify your email by visiting this link:
${verificationLink}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
Joffre Card Game - Multiplayer Trick Card Game
      `.trim(),
    });

    console.log(`✉️  Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`✉️  [DEV MODE] Password reset email would be sent to ${email}`);
    console.log(`   Token: ${resetToken}`);
    console.log(`   Reset at: ${FRONTEND_URL}/reset-password?token=${resetToken}`);
    return false;
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password - Joffre Card Game',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${username}!</h2>
              <p>We received a request to reset your password for your Joffre Card Game account.</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${resetLink}
              </p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </div>
            </div>
            <div class="footer">
              <p>Joffre Card Game - Multiplayer Trick Card Game</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${username}!

We received a request to reset your password for your Joffre Card Game account.

Reset your password by visiting this link:
${resetLink}

This link will expire in 1 hour.

⚠️ Security Notice: If you didn't request a password reset, please ignore this email and ensure your account is secure.

---
Joffre Card Game - Multiplayer Trick Card Game
      `.trim(),
    });

    console.log(`✉️  Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
}
