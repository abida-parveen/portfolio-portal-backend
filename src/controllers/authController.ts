import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../db"; // Import the database client
import dotenv from "dotenv";
import {
  generateEmailToken,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/authUtils";
import { validateToken } from "../utils/tokenUtils";

dotenv.config();

// Login a user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const userResult = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length < 1) {
      res.status(404).json({ error: { message: "User not found" } });
      return;
    }

    const user = userResult.rows[0];

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      // Check if the email is verified
      if (user.is_email_verified) {
        const data = {
          user: {
            id: user.id,
            email: user.email,
          },
        };

        // Generate JWT token
        const authtoken = jwt.sign(data, process.env.JWT_SECRET_KEY!, {
          expiresIn: "1h",
        });

        res.status(200).json({
          message: "Login successful",
          token: authtoken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
        return;
      } else {
        res.status(403).json({ error: { message: "Email not verified" } });
        return;
      }
    } else {
      res
        .status(401)
        .json({ error: { message: "Email or password incorrect" } });
      return;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error logging in user:", err.message);
    } else {
      console.error("Unknown error:", err);
    }
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const saltRounds = 10;
  const { name, email, password } = req.body;

  try {
    const result = await client.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (result.rows.length > 0) {
      res.status(400).json({ error: { message: "Email already exists" } });
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await client.query(
        `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
        [name, email, hashedPassword]
      );
      const { token, expiresAt } = generateEmailToken();
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.rows[0].id, token, expiresAt]
      );
      await sendVerificationEmail(`${process.env.PORT}`, token, email, name);
      res.status(201).json({
        message:
          "Verification email has been sent to your email. Please verify your email. If you don't receive the email, please check your spam folder. If you still can't find it, please contact us.",
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
        },
      });
      return;
    }
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: { message: "Internal Server Error" } });
    return;
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await client.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: user.rows[0] });
    return;
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.query.token ? req.query.token.toString() : undefined;
  try {
    const validatedToken = await validateToken(token);
    if (validatedToken.error) {
      res
        .status(validatedToken.error.status)
        .json({ message: validatedToken.error.message });
    } else {
      const user_id = validatedToken.success.token.user_id;
      const user = await client.query("SELECT email FROM users WHERE id = $1", [
        user_id,
      ]);
      await client.query(
        "UPDATE users SET is_email_verified = true WHERE id = $1",
        [user_id]
      );
      await client.query(
        "DELETE FROM email_verification_tokens WHERE token = $1",
        [token]
      );
      const data = {
        user: {
          id: user_id,
          email: user.rows[0].email,
        },
      };
      const authtoken = jwt.sign(data, process.env.JWT_SECRET_KEY!, {
        expiresIn: "1h",
      });
      res.status(200).json({
        token: authtoken,
        message: "Email verified successfully!",
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "Internal Server Error",
      },
    });
    return;
  }
};

export const resendEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await client.query(
      `SELECT * FROM users where email = $1 AND is_email_verified = false`,
      [email]
    );
    if (user.rows[0] && user.rows[0].id) {
      const { token, expiresAt } = generateEmailToken();
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.rows[0].id, token, expiresAt]
      );
      await sendVerificationEmail(
        `${process.env.PORT}`,
        token,
        email,
        user.rows[0].name
      );
      res.status(201).json({
        message:
          "Verification email has been sent to your email. Please verify your email. If you don't receive the email, please check your spam folder. If you still can't find it, please contact us.",
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
        },
      });
      return;
    } else {
      res.status(404).json({
        message: "User not found or email already verified",
      });
      return;
    }
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email", error });
    return;
  }
};

export const resetPasswordToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  try {
    const user = await client.query("SELECT * FROM users where email = $1", [
      email,
    ]);
    if (user.rows.length > 0) {
      const { token, expiresAt } = generateEmailToken();
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at, type) VALUES ($1, $2, $3, $4)`,
        [user.rows[0].id, token, expiresAt, "forgot_password"]
      );
      await sendResetPasswordEmail(
        `${process.env.PORT}`,
        token,
        email,
        user.rows[0].name
      );
      res.status(200).json({
        message:
          "Forget password email sent successfully. Please check your email. And follow the link to reset your password.",
      });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending email" });
    return;
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { password } = req.body;
  const token = req.query.token ? req.query.token.toString() : undefined;
  try {
    const validatedToken = await validateToken(token);
    if (validatedToken.error) {
      res
        .status(validatedToken.error.status)
        .json({ message: validatedToken.error.message });
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user_id = validatedToken.success.token.user_id;
      await client.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user_id,
      ]);
      await client.query(
        "DELETE FROM email_verification_tokens WHERE token = $1",
        [token]
      );
      res.status(200).json({
        message: "Password reset successfully!",
      });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error resetting password",
    });
    return;
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { password } = req.body;
  const user_id = req.user?.id;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      user_id,
    ]);
    res.status(200).json({ message: "Password changed successfully!" });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
    return;
  }
};
