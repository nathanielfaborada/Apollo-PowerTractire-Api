// src/config/env.js
import dotenv from "dotenv";

dotenv.config();

export const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";
export const isDevelopment = !isProduction;
export const NODE_ENV = process.env.NODE_ENV || "development";