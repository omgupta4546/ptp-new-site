// Gmail REST API Email Service (No Nodemailer)
// Uses direct HTTPS calls to send email via OAuth2 refresh token

async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('client_id', process.env.GMAIL_CLIENT_ID);
  params.append('client_secret', process.env.GMAIL_CLIENT_SECRET);
  params.append('refresh_token', process.env.GMAIL_REFRESH_TOKEN);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to refresh Gmail access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

/**
 * Send OTP verification email to student
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @param {string} studentName - Student name (optional)
 */
const sendOTPEmail = async (to, otp, studentName = 'Student') => {
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 2;
  const subject = '🔐 RTU Placement Cell — Your OTP for Registration';

  const html = `
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
  `;

  try {
    const accessToken = await getAccessToken();

    const base64Subject = Buffer.from(subject).toString('base64');
    const formattedSubject = `=?utf-8?B?${base64Subject}?=`;

    const emailParts = [
      `From: ${process.env.EMAIL_USER}`,
      `To: ${to}`,
      `Subject: ${formattedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
    ];
    const emailString = emailParts.join('\r\n');
    const base64SafeString = Buffer.from(emailString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64SafeString,
      }),
    });

    const sendData = await sendResponse.json();
    if (!sendResponse.ok) {
      throw new Error('Failed to send email via Gmail REST API: ' + JSON.stringify(sendData));
    }
    console.log(`📧 OTP email sent to ${to} via Gmail REST API — MessageId: ${sendData.id}`);
    return sendData;
  } catch (err) {
    console.error('❌ Error sending OTP email via Gmail REST API:', err.message);
    throw err;
  }
};

/**
 * Verify Gmail REST API connection (call on server startup)
 */
const verifyMailerConnection = async () => {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      console.log('✅ Gmail REST API credentials verified successfully');
    }
  } catch (err) {
    console.warn(`⚠️  Gmail REST API status: ${err.message}`);
  }
};

/**
 * Send Password Reset Link email to Student or Admin
 */
const sendResetPasswordEmail = async (to, resetLink, name = 'User') => {
  const subject = '🔑 RTU Placement Cell — Reset Your Password';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password — RTU Placement Cell</title>
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
                Dear <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                We received a request to reset the password for your account on the RTU Placement Cell Portal.
                Click the button below to set a new password:
              </p>
              <!-- Button -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${resetLink}" target="_blank" style="background-color:#003087;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(0,48,135,0.20);">
                  Reset Your Password
                </a>
              </div>
              <p style="margin:0 0 24px;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
                Or copy and paste this URL into your browser:<br/>
                <a href="${resetLink}" style="color:#0047AB;word-break:break-all;">${resetLink}</a>
              </p>
              <div style="background:#fff7ed;border-left:4px solid #FFB800;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⏱ <strong>Note:</strong> This link will expire in 15 minutes.
                  If you did not request a password reset, please ignore this email; your password will remain unchanged.
                </p>
              </div>
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
  `;

  try {
    const accessToken = await getAccessToken();
    const base64Subject = Buffer.from(subject).toString('base64');
    const formattedSubject = `=?utf-8?B?${base64Subject}?=`;

    const emailParts = [
      `From: ${process.env.EMAIL_USER}`,
      `To: ${to}`,
      `Subject: ${formattedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
    ];
    const emailString = emailParts.join('\r\n');
    const base64SafeString = Buffer.from(emailString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64SafeString,
      }),
    });

    const sendData = await sendResponse.json();
    if (!sendResponse.ok) {
      throw new Error('Failed to send reset email: ' + JSON.stringify(sendData));
    }
    console.log(`📧 Reset password email sent to ${to} — MessageId: ${sendData.id}`);
    return sendData;
  } catch (err) {
    console.error('❌ Error sending reset password email:', err.message);
    throw err;
  }
};

module.exports = { sendOTPEmail, verifyMailerConnection, sendResetPasswordEmail };
