const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports (TLS via STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send OTP verification email to student
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @param {string} studentName - Student name (optional)
 */
const sendOTPEmail = async (to, otp, studentName = 'Student') => {
  const transporter = createTransporter();

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 2;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: '🔐 RTU Placement Cell — Your OTP for Registration',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification — RTU Placement Cell</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,48,135,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#003087 0%,#0047AB 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFB800;font-size:22px;font-weight:700;letter-spacing:1px;">
                🎓 RTU KOTA
              </h1>
              <p style="margin:6px 0 0;color:#ffffff;font-size:14px;opacity:0.9;">
                Training &amp; Placement Cell
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#374151;font-size:16px;">
                Dear <strong>${studentName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                You have requested OTP verification to register on the RTU Placement Cell Portal.
                Use the code below to complete your verification:
              </p>
              <!-- OTP Box -->
              <div style="background:#f0f4ff;border:2px dashed #0047AB;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 6px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
                <p style="margin:0;color:#003087;font-size:42px;font-weight:900;letter-spacing:10px;">${otp}</p>
                <p style="margin:8px 0 0;color:#ef4444;font-size:12px;">⏱ Expires in ${expiryMinutes} minutes</p>
              </div>
              <div style="background:#fff7ed;border-left:4px solid #FFB800;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone.
                  RTU Placement Cell will never ask for your OTP over call or email.
                </p>
              </div>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                If you did not request this OTP, please ignore this email or contact the T&amp;P Cell immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} Rajasthan Technical University, Kota &nbsp;|&nbsp; Training &amp; Placement Cell<br/>
                Rawatbhata Road, Kota, Rajasthan — 324010
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 OTP email sent to ${to} — MessageId: ${info.messageId}`);
  return info;
};

/**
 * Verify SMTP connection (call on server startup)
 */
const verifyMailerConnection = async () => {
  try {
    const transporter = createTransporter();
    // Non-blocking quick check
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP verify timeout (skipped)')), 2000))
    ]);
    console.log('✅ SMTP Mailer connection verified');
  } catch (err) {
    console.warn(`⚠️  SMTP Mailer status: ${err.message}`);
  }
};

module.exports = { sendOTPEmail, verifyMailerConnection };
