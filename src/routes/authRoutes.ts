import express from "express";
import { body } from "express-validator";
import {
  changePassword,
  createUser,
  loginUser,
  resendEmail,
  resetPasswordToken,
  verifyEmail,
  verifyToken,
} from "../controllers/authController";
import { validateRequest } from "../middleware/validateRequest";
import { emailRateLimiter } from "../middleware/emailRateLimiter";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  validateRequest,
  loginUser
);

router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 6 characters").isLength({
      min: 6,
    }),
  ],
  validateRequest,
  createUser
);

router.get("/verify-token", requireAuth, verifyToken);

router.get("/verify-email", verifyEmail);

router.post(
  "/resend-email",
  emailRateLimiter,
  [body("email", "Enter a valid email").isEmail()],
  validateRequest,
  resendEmail
);

router.post(
  "/reset-password-token",
  emailRateLimiter,
  [body("email", "Enter a valid email").isEmail()],
  validateRequest,
  resetPasswordToken
);

router.post(
  "/reset-password",
  [
    body("password", "Password must be atleast 6 characters").isLength({
      min: 6,
    }),
  ],
  validateRequest
);

router.post(
  "/change-password",
  requireAuth,
  [
    body("password", "Password must be atleast 6 characters").isLength({
      min: 6,
    }),
  ],
  changePassword
);

export default router;
