import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { connectRabbitMQ } from "./config/rabbitMQConfig";
import { initializeRedisClients } from "./config/redisConfig";
import { checkUserConfig } from "./middleware/checkUserConfig";
import { googleSheetWebhook } from "./controller/googleSheetWebhookController";
import { storeDbUserConfig } from "./controller/storeDbUserConfigController";
import { removeDbUserConfig } from "./controller/removeDbUserConfigController";
import { setupGracefulShutdown } from "./services/shutdownService";
// Single user testing function imported =>
import { connectToUserDb_fix_dbUserId } from "./debugFile/db_test";
import { reconnectToAllUserDbs } from "./services/reconnectToAllUserDbs";

const app = express();
app.use(express.json());

// API ENDPOINTS

app.get("/*", (req, res) => {
  res.status(200).json({
    message: "Hello everyone!",
    success: true,
  });
});

// API to store user config
app.post("/api/store-config", storeDbUserConfig);

// API to remove user config
app.post("/api/remove-config", removeDbUserConfig);

// Webhook POST handler for Google Sheets updates
app.post("/api/google-sheet-webhook", checkUserConfig, googleSheetWebhook);

// dbUserId: 'Aditya1985' => since, currently working with one user for dummy test
// connectToUserDb_fix_dbUserId();

// Start the server
const PORT = 3100;

async function startServer() {
  await initializeRedisClients(); // Call the Redis initialization function on startup
  await connectRabbitMQ(); // Connect to RabbitMQ on startup
  await reconnectToAllUserDbs(); // Reconnect to all user databases on startup

  // Start your server logic here (e.g., Express app)
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Call the startServer function to initiate the process
startServer().catch((err) => {
  console.error("Error starting the server:", err);
});

setupGracefulShutdown();
