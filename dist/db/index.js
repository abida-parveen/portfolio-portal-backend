"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const client = new pg_1.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});
// Connect to the PostgreSQL database
client
    .connect()
    .then(() => console.log("Connected to PostgreSQL database successfully."))
    .catch((err) => console.error("Error connecting to PostgreSQL database:", err));
exports.default = client;
