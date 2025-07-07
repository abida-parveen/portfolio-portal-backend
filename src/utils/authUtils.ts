import crypto from "crypto";
import { sendEmail } from "../services/mailService";
import {
  getResetPasswordEmail,
  getVerificationEmail,
} from "../templates/emailTemplates";

export const generateEmailToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  return { token, expiresAt };
};

export const sendVerificationEmail = async (
  port: string,
  token: string,
  email: string,
  name: string
) => {
  const verificationLink = `http://localhost:${port}/api/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Please verify your email",
    html: getVerificationEmail(name, verificationLink),
  });
};

export const sendResetPasswordEmail = async (
  port: string,
  token: string,
  email: string,
  name: string
) => {
  const verificationLink = `http://localhost:${port}/api/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: getResetPasswordEmail(name, verificationLink),
  });
};


