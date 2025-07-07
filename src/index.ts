import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Read port from the environment variable or default to 8080
const port = process.env.PORT || 8080;

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
  })
);

// Middleware to handle JSON requests
app.use(express.json());

// custom route
app.use("/api/auth", authRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
