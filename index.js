import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import cors from "cors"
import xss from "xss-clean"

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

//prevent xss attacks
app.use(xss());

//allow cross origin requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", 
    credentials: true,
  })
);
app.use(express.json())

// custom routes
app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
