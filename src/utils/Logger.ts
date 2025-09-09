import { format, createLogger, transports } from "winston";
import fs from "fs";
import { env } from "../configs";
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.json()
);

export default createLogger({
  level: env.NODE_ENV.toUpperCase() === "PRODUCTION" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "yahuah-dabar" },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});
