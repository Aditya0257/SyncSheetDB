// shutdownService.ts
import { userDbClients } from "../config/dbUserConfig";
import { disconnectRabbitMQ } from "../config/rabbitMQConfig";
import { closeRedisClients } from "../config/redisConfig";
import { closeUserDbConnection } from "./dbService";


// Close all active PostgreSQL connections
async function closeAllUserDbConnections() {
  const userIds = Object.keys(userDbClients);
  for (const dbUserId of userIds) {
    closeUserDbConnection(dbUserId);
  }
}

// Gracefully shut down services
export async function gracefulShutdown() {
  console.log("Gracefully shutting down...");

  // 1. Close all PostgreSQL connections
  await closeAllUserDbConnections();

  // 2. Disconnect from RabbitMQ
  await disconnectRabbitMQ();

  // 3. Close Redis connections
  await closeRedisClients();

  console.log("All connections closed. Exiting process.");
}

// Listen for process termination signals
export function setupGracefulShutdown() {
  process.on("SIGINT", async () => {
    console.log("Received SIGINT. Shutting down...");
    await gracefulShutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM. Shutting down...");
    await gracefulShutdown();
    process.exit(0);
  });

  process.on("uncaughtException", async (err) => {
    console.error("Uncaught exception:", err);
    await gracefulShutdown();
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason, promise) => {
    console.error("Unhandled rejection:", reason, promise);
    await gracefulShutdown();
    process.exit(1);
  });
}
