import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_FROM', 'EMAIL_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      email: process.env.EMAIL_FROM,
      passwordLength: process.env.EMAIL_PASSWORD?.length
    });

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Additional options for better handling
      pool: true,
      maxConnections: 1,
      rateDelta: 1000,
      rateLimit: 5
    });
  }

  async sendVerificationEmail(email, username, verificationOTP) {
    try {
      // Test connection first
      await this.testConnection();
      
      const mailOptions = {
        from: {
          name: 'TrustMart', // Add sender name
          address: process.env.EMAIL_FROM
        },
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(username, verificationOTP),
        // Add text version for email clients that don't support HTML
        text: this.getTextVersion(username, verificationOTP)
      };

      console.log('Attempting to send email to:', email);
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      // More specific error messages
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please check your email credentials and ensure you\'re using an App Password if 2FA is enabled.');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Unable to connect to email server. Please check your network connection and SMTP settings.');
      } else {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    }
  }

  getTextVersion(username, verificationOTP) {
    return `
Hello ${username}!

Welcome to TrustMart! To complete your account setup, please verify your email address using the verification code below.

Your Verification Code: ${verificationOTP}

This code expires in 15 minutes.

Enter this code in the verification form to activate your account.

If you didn't create an account with TrustMart, you can safely ignore this email.

Best regards,
TrustMart Team
    `;
  }

  async testConnection() {
    try {
      const isConnected = await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      
      // Provide specific guidance based on error
      if (error.code === 'EAUTH') {
        console.error('\n🔐 AUTHENTICATION ISSUE DETECTED:');
        console.error('1. Ensure you\'re using the correct email and password');
        console.error('2. If you have 2FA enabled, use an App Password from: https://myaccount.google.com/apppasswords');
        console.error('3. If 2FA is disabled, enable "Less Secure Apps": https://myaccount.google.com/lesssecureapps');
      }
      
      throw error;
    }
  }

getVerificationEmailTemplate(username, verificationOTP) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - TrustMart</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0f0f0f 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
            TrustMart
          </h1>
          <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
            Secure Email Verification
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- Greeting -->
          <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hello ${username}! 👋
          </h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
            Welcome to <strong>TrustMart</strong>! To complete your account setup and ensure the security of your account, please verify your email address using the verification code below.
          </p>

          <!-- OTP Section -->
          <div style="background: linear-gradient(135deg, #2b2b2b 0%, #1e1e1e 50%, #333333 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <p style="color: #e0e0e0; margin: 0 0 15px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
              Your Verification Code
            </p>
            
            <!-- OTP Display -->
            <div style="background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%); border: 2px solid #444444; border-radius: 8px; padding: 20px; margin: 15px 0; display: inline-block; min-width: 200px; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);">
              <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 8px; margin: 0; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">
                ${verificationOTP}
              </div>
            </div>
            
            <p style="color: #b8b8b8; margin: 15px 0 0 0; font-size: 14px;">
              Enter this code in the verification form to activate your account
            </p>
          </div>

          <!-- Instructions -->
          <div style="background-color: #fff5f5; border-left: 4px solid #f56565; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #c53030; margin: 0; font-size: 14px; font-weight: 600;">
              ⏰ Important: This code expires in 15 minutes
            </p>
            <p style="color: #742a2a; margin: 5px 0 0 0; font-size: 13px;">
              For security reasons, please complete the verification process promptly.
            </p>
          </div>

          <!-- Additional Info -->
          <div style="margin: 30px 0;">
            <h3 style="color: #2d3748; font-size: 18px; margin: 0 0 15px 0;">
              What's next?
            </h3>
            <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Go back to the verification page</li>
              <li style="margin-bottom: 8px;">Enter the 6-digit code above</li>
              <li style="margin-bottom: 8px;">Start exploring TrustMart!</li>
            </ul>
          </div>

          <!-- Troubleshooting -->
          <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px;">
              Didn't request this?
            </h4>
            <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.5;">
              If you didn't create an account with TrustMart, you can safely ignore this email. Your email address may have been entered by mistake.
            </p>
          </div>

          <!-- CTA for new code -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #718096; font-size: 14px; margin: 0 0 15px 0;">
              Need a new code?
            </p>
            <p style="color: #4a5568; font-size: 13px; margin: 0;">
              You can request a new verification code from the verification page if this one expires.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0;">
          <div style="text-align: center;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0 0 8px 0; line-height: 1.4;">
              This is an automated message from TrustMart. Please do not reply to this email.
            </p>
            <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.4;">
              © ${new Date().getFullYear()} TrustMart. All rights reserved.
            </p>
          </div>
          
          <!-- Security note -->
          <div style="margin-top: 20px; padding: 15px; background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">
            <p style="color: #4a5568; font-size: 11px; margin: 0; text-align: center; line-height: 1.4;">
              🔒 <strong>Security Tip:</strong> TrustMart will never ask for your password via email. 
              If you receive suspicious emails, please contact our support team.
            </p>
          </div>
        </div>

      </div>
      
      <!-- Mobile Responsiveness -->
      <style>
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            padding: 0 !important;
          }
          .content {
            padding: 20px !important;
          }
          .otp-code {
            font-size: 28px !important;
            letter-spacing: 6px !important;
          }
        }
      </style>
    </body>
    </html>
  `;
}

}

export default new EmailService();