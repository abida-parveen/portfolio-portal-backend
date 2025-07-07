import client from "../db";

export const validateToken = async (token: string | undefined) => {
  if (token) {
    const verification_token = await client.query(
      "SELECT * FROM email_verification_tokens WHERE token = $1",
      [token]
    );
    if (verification_token.rows.length < 1) {
      return {
        error: {
          status: 404,
          message: "Invalid or expired link. Please try again.",
        },
      };
    } else {
      const expiresAt = new Date(verification_token.rows[0].expires_at);
      const now = new Date();
      if (expiresAt < now) {
        return {
          error: {
            status: 400,
            message: "Invalid or expired link. Please request a new link.",
          },
        };
      } else {
        return {
          success: {
            token: verification_token.rows[0],
          },
        };
      }
    }
  } else {
    return {
      error: {
        status: 404,
        message: "Invalid or expired link. Please try again.",
      },
    };
  }
};
