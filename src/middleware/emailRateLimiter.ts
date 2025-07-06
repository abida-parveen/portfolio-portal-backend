import rateLimit from "express-rate-limit";

export const emailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many requests. Please check your email or try again later.",
});
