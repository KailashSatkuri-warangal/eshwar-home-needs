import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '465');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromAddress = process.env.SMTP_FROM || user;

const isSmtpConfigured = user && pass;

// Create SMTP Transporter only if configured, otherwise fall back to mock
const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
    })
  : null;

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (transporter) {
    console.log(`Sending SMTP email from ${fromAddress} to ${to}...`);
    await transporter.sendMail({
      from: `"ESHwar Home Needs" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent successfully to ${to}`);
  } else {
    console.log('\n=================== [MOCK EMAIL SERVICE] ===================');
    console.log(`From:    orders@eshwarhomeneeds.com`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text}`);
    console.log('============================================================\n');
    console.log('💡 TIP: Set SMTP_USER and SMTP_PASS in .env.local to send real emails!');
  }
}
