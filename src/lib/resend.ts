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
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #060B08; color: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0CBF6A; font-size: 24px; margin: 0;">Rawgrowth</h1>
        </div>
        <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">Your portal is ready. Click below to access your dashboard.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; background: #0CBF6A; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">Access Portal</a>
        </div>
        <p style="color: rgba(255,255,255,0.4); font-size: 13px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return { error };
  }

  return { data, link };
}
