import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendMagicLinkEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.rawgrowth.ai';
  const link = `${baseUrl}/login/verify?token=${token}`;

  if (!resend) {
    console.warn('RESEND_API_KEY not set. Magic link:', link);
    return { link };
  }

  const { data, error } = await resend.emails.send({
    from: 'Rawgrowth <portal@rawgrowth.ai>',
    to: email,
    subject: 'Your Rawgrowth Portal Access',
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Your Rawgrowth Portal Access</title>
  </head>
  <body style="margin:0;padding:0;background-color:#060B08;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your secure login link for the Rawgrowth Client Portal. Expires in 24 hours.</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#060B08;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">

            <tr>
              <td align="center" style="padding-bottom:28px;">
                <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#0CBF6A;">Client Portal</p>
                <h1 style="margin:0;font-size:26px;font-weight:500;letter-spacing:-0.5px;color:rgba(255,255,255,0.92);">Rawgrowth</h1>
              </td>
            </tr>

            <tr>
              <td style="background-color:#0A1210;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:40px 40px 36px 40px;">
                <div style="height:1px;width:100%;background:linear-gradient(90deg, rgba(12,191,106,0) 0%, rgba(12,191,106,0.4) 50%, rgba(12,191,106,0) 100%);margin:-40px -40px 32px -40px;width:auto;"></div>

                <h2 style="margin:0 0 14px 0;font-size:22px;font-weight:600;line-height:1.3;color:rgba(255,255,255,0.95);">Access your Rawgrowth Portal</h2>
                <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.65);">
                  Click the button below to securely sign in to your Rawgrowth dashboard. No password needed.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding:4px 0 8px 0;">
                      <a href="${link}" style="display:inline-block;background-color:#0CBF6A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;box-shadow:0 4px 14px rgba(12,191,106,0.25);">
                        Access Portal &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

               

                <div style="height:1px;background-color:rgba(255,255,255,0.06);margin:32px 0 20px 0;"></div>

                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.4);">
                  This link expires in <strong style="color:rgba(255,255,255,0.6);font-weight:600;">24 hours</strong>. If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:28px;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.3);">
                  Sent by Rawgrowth &middot; Your AI Department
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  if (error) {
    console.error('Resend error:', error);
    return { error };
  }

  return { data, link };
}
