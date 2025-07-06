import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
});

// Connect to the PostgreSQL database

const connectDb = async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database!");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
  }
};

connectDb()

export default client;
