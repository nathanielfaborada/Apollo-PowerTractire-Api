import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/env.js";
import bodyParser from "body-parser";
import morgan from "morgan";

import v1 from "./routes/v1/index.js";
import "./core/database.js";

/* ================= CONFIG ================= */

const PORT = process.env.PORT || 3000;

/* ================= EXPRESS APP ================= */

const app = express();
app.set("trust proxy", 1); // FOR RAILWAY
const server = http.createServer(app);

app.use(morgan("combined"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Allow popups to communicate back to opener
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://localhost",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS")),
    credentials: true,
  }),
);

app.use("/v1", v1);
app.use("/", v1);




/* ================= START SERVER ================= */

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `CLIENT reached with URL ${process.env.CLIENT_URL} && http://localhost:5173`,
  );
  console.log(`🚀 Server running on port ${PORT}`);
});