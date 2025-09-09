import cluster from "cluster";
import os from "os";
import { app } from "./app";
import { Logger } from "./utils";
import { env } from "./configs";

const PORT = env.PORT;
const numCPUs = os.cpus().length;

if (cluster.isPrimary && env.NODE_ENV.toLowerCase() === "production") {
  Logger.info(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    Logger.warn(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    Logger.info(`yahuah-dabar Server running on port ${PORT}`);
    Logger.info(`Process ${process.pid} started`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  Logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
