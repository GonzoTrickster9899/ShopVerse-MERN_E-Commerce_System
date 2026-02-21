const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Dev: use console logging
  return {
    sendMail: async (options) => {
      console.log('📧 Email sent (dev mode):');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Body preview: ${options.text?.substring(0, 100)}...`);
      return { messageId: 'dev-mode' };
    },
  };
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ShopVerse'} <${process.env.FROM_EMAIL || 'noreply@shopverse.com'}>`,
    to,
    subject,
    text,
    html,
  };
  return await transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
  welcomeEmail: (user, verificationUrl) => ({
    subject: 'Welcome to ShopVerse! Verify your email',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0; font-size: 32px;">ShopVerse</h1>
          <p style="color: #a0a0b0; margin: 10px 0 0;">Your Marketplace, Redefined</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e;">Welcome, ${user.firstName}! 🎉</h2>
          <p style="color: #555; line-height: 1.6;">Thank you for joining ShopVerse. Please verify your email address to get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #e94560; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 13px;">This link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `Welcome to ShopVerse, ${user.firstName}! Verify your email: ${verificationUrl}`,
  }),

  resetPasswordEmail: (user, resetUrl) => ({
    subject: 'ShopVerse - Password Reset Request',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">ShopVerse</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e;">Reset Your Password</h2>
          <p style="color: #555;">Hi ${user.firstName}, we received a password reset request.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #e94560; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 13px;">This link expires in 30 minutes.</p>
        </div>
      </div>
    `,
    text: `Reset your password: ${resetUrl}`,
  }),

  orderConfirmation: (user, order) => ({
    subject: `ShopVerse - Order Confirmed #${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">ShopVerse</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e;">Order Confirmed! ✅</h2>
          <p style="color: #555;">Hi ${user.firstName || user.guestName}, your order has been placed successfully.</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Items:</strong> ${order.items.length}</p>
            <p><strong>Total:</strong> ₱${order.totalPrice.toLocaleString()}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
          </div>
        </div>
      </div>
    `,
    text: `Order confirmed! #${order.orderNumber}. Total: ₱${order.totalPrice}`,
  }),

  orderStatusUpdate: (user, order) => ({
    subject: `ShopVerse - Order ${order.status} #${order.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">ShopVerse</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a2e;">Order Update</h2>
          <p>Order #${order.orderNumber} status: <strong style="color: #e94560;">${order.status.replace(/_/g, ' ').toUpperCase()}</strong></p>
          ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
        </div>
      </div>
    `,
    text: `Order #${order.orderNumber} is now ${order.status}`,
  }),
};

module.exports = { sendEmail, emailTemplates };
