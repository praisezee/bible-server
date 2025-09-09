import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { Logger } from "./utils";
import { prisma, env } from "./configs";
import { errorHandler } from "./middlewares";
import { routes } from "./routes";

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use("/api", routes);

//Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Global error handler
app.use(errorHandler);

prisma
  .$connect()
  .then(() => Logger.info("Database connected successfully"))
  .catch((error) => {
    Logger.error("Database connection failed:", error);
    process.exit(1);
  });

export { app };
export default app;
