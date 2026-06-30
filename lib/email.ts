import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendItemUpdateEmail({
  to,
  ownerName,
  itemTitle,
}: {
  to: string;
  ownerName: string;
  itemTitle: string;
}): Promise<void> {
  await transporter.sendMail({
    from: `"WishLink" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${ownerName} updated an item on their wishlist`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
            <tr>
              <td style="background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e5e5;">
                <p style="font-size: 13px; color: #888; margin: 0 0 24px;">WishLink</p>
                <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 12px;">
                  Item updated 📝
                </h1>
                <p style="font-size: 15px; color: #444; margin: 0 0 32px; line-height: 1.6;">
                  <strong>${ownerName}</strong> updated an item you claimed:
                  <strong>"${itemTitle}"</strong>.<br/>
                  You may want to check if the details still work for you.
                </p>
                <p style="font-size: 12px; color: #aaa; margin: 32px 0 0; line-height: 1.5;">
                  You received this because you claimed an item on WishLink.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendInviteEmail({
  to,
  ownerName,
  wishlistTitle,
  shareToken,
}: {
  to: string;
  ownerName: string;
  wishlistTitle: string;
  shareToken: string;
}): Promise<void> {
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${shareToken}`;

  await transporter.sendMail({
    from: `"WishLink" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${ownerName} invited you to their WishLink wishlist 🎁`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
            <tr>
              <td style="background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e5e5;">
                <p style="font-size: 13px; color: #888; margin: 0 0 24px;">WishLink</p>
                <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 12px;">
                  You're invited! 🎁
                </h1>
                <p style="font-size: 15px; color: #444; margin: 0 0 32px; line-height: 1.6;">
                  <strong>${ownerName}</strong> wants to share their
                  <strong>"${wishlistTitle}"</strong> with you.
                </p>
                <a
                  href="${shareUrl}"
                  style="display: inline-block; background: #111; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px;"
                >
                  View Wishlist
                </a>
                <p style="font-size: 12px; color: #aaa; margin: 32px 0 0; line-height: 1.5;">
                  If the button doesn't work, copy and paste this link:<br/>
                  <a href="${shareUrl}" style="color: #888;">${shareUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
