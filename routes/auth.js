import express from "express";
import bcrypt from "bcrypt";
import db from "../db.js";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { emailLimiter, verifyToken } from "./middleware/auth.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 6 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      const user = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (user.rows.length < 1) {
        res.status(404).json({ error: { message: "User not found" } });
      } else {
        const isPasswordCorrect = await bcrypt.compare(
          password,
          user.rows[0].password
        );

        if (isPasswordCorrect) {
          const data = {
            user: {
              id: user.rows[0].id,
              email: user.rows[0].email,
            },
          };
          if (user.rows[0].is_email_verified) {
            const authtoken = jwt.sign(data, process.env.JWT_SECRET_KEY, {
              expiresIn: "1h",
            });
            return res.status(200).json({
              message: "Login successful",
              token: authtoken,
              user: {
                id: user.rows[0].id,
                email: user.rows[0].email,
                name: user.rows[0].name,
              },
            });
          } else {
            return res
              .status(403)
              .json({ error: { message: "Email not verified" } });
          }
        } else {
          return res
            .status(401)
            .json({ error: { message: "Email or password incorrect" } });
        }
      }
    } catch (err) {
      console.error("Error registering user:", err.message);
      return res
        .status(500)
        .json({ error: { message: "Internal Server Error" } });
    }
  }
);

router.get("/verify-token", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: user.rows[0] });
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 6 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const saltRounds = 10;
    const { name, email, password } = req.body;

    try {
      const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
        email,
      ]);
      if (result.rows.length > 0) {
        return res
          .status(400)
          .json({ error: { message: "Email already exists" } });
      } else {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await db.query(
          `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
          [name, email, hashedPassword]
        );
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
        await db.query(
          `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
          [user.rows[0].id, token, expiresAt]
        );
        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`;
        await transporter.sendMail({
          from: `"Abida" <${process.env.NODEMAILER_EMAIL}>`,
          to: email,
          subject: "Please verify your email",
          html: `
            <p>Hi ${name},</p>
            <p>Thanks for registering. Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 15 minutes.</p>
          `,
        });
        return res.status(201).json({
          message:
            "Verification email has been sent to your email. Please verify your email. If you don't receive the email, please check your spam folder. If you still can't find it, please contact us.",
          user: {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
          },
        });
      }
    } catch (err) {
      console.error("Error registering user:", err.message);
      return res
        .status(500)
        .json({ error: { message: "Internal Server Error" } });
    }
  }
);

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const verification_token = await db.query(
      "SELECT * FROM email_verification_tokens WHERE token = $1",
      [token]
    );
    if (verification_token.rows.length < 1) {
      return res.status(404).json({
        error: { message: "Invalid or expired verification link. Try again!" },
      });
    } else {
      const expiresAt = new Date(verification_token.rows[0].expires_at);
      const now = new Date();
      if (expiresAt < now) {
        res.status(400).json({
          error: {
            message: "Invalid or expired verification link. Try again!",
          },
        });
      } else {
        const user_id = verification_token.rows[0].user_id;
        const user = await db.query("SELECT email FROM users WHERE id = $1", [
          user_id,
        ]);
        await db.query(
          "UPDATE users SET is_email_verified = true WHERE id = $1",
          [user_id]
        );
        await db.query(
          "DELETE FROM email_verification_tokens WHERE token = $1",
          [token]
        );
        const data = {
          user: {
            id: user_id,
            email: user.rows[0].email,
          },
        };
        const authtoken = jwt.sign(data, process.env.JWT_SECRET_KEY, {
          expiresIn: "1h",
        });
        return res.status(200).json({
          token: authtoken,
          message: "Email verified successfully!",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: {
        message: "Internal Server Error",
      },
    });
  }
});

router.post(
  "/resend-mail",
  emailLimiter,
  [body("email", "Enter a valid email").isEmail()],
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await db.query(
        `SELECT * FROM users where email = $1 AND is_email_verified = false`,
        [email]
      );
      if (user.rows[0] && user.rows[0].id) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
        await db.query(
          `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
          [user.rows[0].id, token, expiresAt]
        );
        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`;
        await transporter.sendMail({
          from: `"Abida" <${process.env.NODEMAILER_EMAIL}>`,
          to: email,
          subject: "Please verify your email",
          html: `
            <p>Hi ${user.rows[0].name},</p>
            <p>Thanks for registering. Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 15 minutes.</p>
          `,
        });
        return res.status(201).json({
          message:
            "Verification email has been sent to your email. Please verify your email. If you don't receive the email, please check your spam folder. If you still can't find it, please contact us.",
          user: {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
          },
        });
      } else {
        return res.status(404).json({
          message: "User not found or email already verified",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Failed to send email", error });
    }
  }
);

router.post(
  "/reset-password-token",
  emailLimiter,
  [body("email", "Enter a valid email").isEmail()],
  async (req, res) => {
    const { email } = req.body;
    try {
      const user = await db.query("SELECT * FROM users where email = $1", [
        email,
      ]);
      if (user.rows.length > 0) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
        await db.query(
          `INSERT INTO email_verification_tokens (user_id, token, expires_at, type) VALUES ($1, $2, $3, $4)`,
          [user.rows[0].id, token, expiresAt, "forgot_password"]
        );
        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/reset-password?token=${token}`;
        await transporter.sendMail({
          from: `"Abida" ${process.env.NODEMAILER_EMAIL}`,
          to: email,
          subject: "Reset your password",
          html: `
            <p>Hi ${user.rows[0].name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${verificationLink}">Reset Password</a>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>This link will expire in <strong>15 minutes</strong> for your security.</p>
            <p>Best regards,<br>Your App Team</p>`,
        });
        return res.status(200).json({
          message:
            "Forget password email sent successfully. Please check your email. And follow the link to reset your password.",
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error sending email" });
    }
  }
);

router.post(
  "/reset-password",
  [
    body("password", "Password must be atleast 6 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const { password } = req.body;
    const token = req.query.token;
    try {
      const verification_token = await db.query(
        "SELECT * FROM email_verification_tokens WHERE token = $1",
        [token]
      );
      if (verification_token.rows.length < 1) {
        return res.status(404).json({
          error: { message: "Invalid or expired reset link. Please try again." },
        });
      } else {
        const expiresAt = new Date(verification_token.rows[0].expires_at);
        const now = new Date();
        if (expiresAt < now) {
          return res.status(400).json({
            error: {
              message: "Invalid or expired reset link. Please request a new password reset.",
            },
          });
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user_id = verification_token.rows[0].user_id;
          await db.query("UPDATE users SET password = $1 WHERE id = $2", [
            hashedPassword,
            user_id,
          ]);
          await db.query(
            "DELETE FROM email_verification_tokens WHERE token = $1",
            [token]
          );
          return res.status(200).json({
            message: "Password reset successfully!",
          });
        }
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error resetting password",
      });
    }
  }
);

router.post(
  "/change-password",
  verifyToken,
  [
    body("password", "Password must be atleast 6 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const { password } = req.body;
    const user_id = req.user.id;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user_id,
      ]);
      return res
        .status(200)
        .json({ message: "Password changed successfully!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error changing password" });
    }
  }
);

export default router;
