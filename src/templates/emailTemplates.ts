export const getVerificationEmail = (name: string, link: string): string => {
    return `
      <div style="font-family: sans-serif">
        <h2>Hi ${name},</h2>
        <p>Thanks for registering. Click the link below to verify your email address:</p>
        <a href="${link}" style="color: blue;">Verify Email</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn’t request this, please ignore this email.</p>
      </div>
    `;
  };  

  export const getResetPasswordEmail = (name: string, link: string): string => {
    return `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="${link}">Reset Password</a>
      <p>This link will expire in <strong>15 minutes</strong> for your security.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
  };
  