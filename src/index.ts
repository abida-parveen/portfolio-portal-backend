import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Read port from the environment variable or default to 3000
const port = process.env.PORT || 3000;

// Middleware to handle JSON requests
app.use(express.json());

// custom route
app.use("/api/auth", authRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
