/**
 * Email Service
 * Handles sending emails for verification and password reset
 * Uses Resend API (Railway blocks SMTP ports)
 */

import { Resend } from 'resend';

// Email configuration from environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Jaffre <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  // If Resend is not configured, return null
  if (!RESEND_API_KEY) {
    console.warn('⚠️  Email service not configured. Set RESEND_API_KEY in .env');
    return null;
  }

  // Create client if it doesn't exist
  if (!resendClient) {
    console.log(`🔧 Initializing Resend email service...`);
    console.log(`   API Key length: ${RESEND_API_KEY.length} chars`);
    console.log(`   From address: ${EMAIL_FROM}`);

    resendClient = new Resend(RESEND_API_KEY);

    console.log(`✉️  Email service configured with Resend API`);
  }

  return resendClient;
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationToken: string
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`✉️  [DEV MODE] Verification email would be sent to ${email}`);
    console.log(`   Token: ${verificationToken}`);
    console.log(`   Verify at: ${FRONTEND_URL}/verify-email?token=${verificationToken}`);
    return false;
  }

  const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  console.log(`📧 Attempting to send verification email to ${email}...`);
  console.log(`   Link: ${verificationLink}`);
  console.log(`   From: ${EMAIL_FROM}`);

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log(`✅ Verification email sent successfully to ${email}`);
    console.log(`   Email ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:');
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('   Stack trace:', error.stack);
    }
    // Don't block user registration if email fails
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
  const resend = getResendClient();

  if (!resend) {
    console.log(`✉️  [DEV MODE] Password reset email would be sent to ${email}`);
    console.log(`   Token: ${resetToken}`);
    console.log(`   Reset at: ${FRONTEND_URL}/reset-password?token=${resetToken}`);
    return false;
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  console.log(`📧 Attempting to send password reset email to ${email}...`);
  console.log(`   Link: ${resetLink}`);
  console.log(`   From: ${EMAIL_FROM}`);

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log(`✅ Password reset email sent successfully to ${email}`);
    console.log(`   Email ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:');
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('   Stack trace:', error.stack);
    }
    // Don't block password reset flow if email fails
    return false;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    return false;
  }

  // Resend doesn't have a verify method, but we can check if client was created
  console.log('✅ Resend email service is ready');
  return true;
}
