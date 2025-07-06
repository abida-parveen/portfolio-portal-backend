"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
// Read port from the environment variable or default to 3000
const port = process.env.PORT || 3000;
// Middleware to handle JSON requests
app.use(express_1.default.json());
// Example route
app.get("/", (req, res) => {
    res.send("Hello, world!");
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
