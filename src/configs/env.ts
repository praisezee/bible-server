import { config } from "dotenv";

config();

export default {
  //PORTS AND SERVER CONFIG
  PORT: parseInt(process.env.PORT || "3500"),
  NODE_ENV: process.env.NODE_ENV || "development",
  //DATEBASE
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/hayim",
  //JWTS
  ACCESS_TOKEN:
    process.env.ACCESS_TOKEN || "5539c1a401c914236dae467b986438f3466aef368883eae569df3da5b6bdb5c0",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "1",
  REFRESH_TOKEN:
    process.env.REFRESH_TOKEN || "67c838ccba6bfa087a0a19b48e6123471e52e170bb19b71b0b24766081fca8b7",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30",
  //CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
