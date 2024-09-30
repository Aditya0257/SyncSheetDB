import { getUserConfig, userDbClients } from "../config/dbUserConfig";
import { sheetChannel } from "../config/rabbitMQConfig";
import generateUserLockKey from "../utils/generateLockKey";
import { sendToQueue } from "./rabbitMQServices";
import { acquireLock, releaseLock } from "./redisServices";
import pkg from "pg";
const { Client } = pkg;

// Establish PostgreSQL connection for a specific user
export async function connectToUserDb(dbUserId: any) {
  try {
    console.log(
      `Running "connectToUserDb" func to start "Notify" event for this dbUserId to listen to updates from their DB.`
    );
    const userConfig = await getUserConfig(dbUserId);
    if (!userConfig) {
      // console.log("User config not found!")
      throw new Error("User config not found");
    }

    const { dbConfig } = userConfig;
    // console.log("dbConfig: ");
    // console.log(dbConfig);
    if(dbConfig) console.log(`Got dbConfig for dbUserId: ${dbUserId}`);
    const dbClient = new Client(dbConfig);
    await dbClient.connect();

    // Store the connected pgClient for the user
    userDbClients[dbUserId] = dbClient;

    // Listen to PostgreSQL notifications (e.g., if you have triggers set up)
    await dbClient.query("LISTEN db_update_channel");

    dbClient.on("notification", async (msg) => {
      console.log(`In the db listening event!, for the dbUserId: ${dbUserId}`);
      if (!msg.payload)
        throw new Error("msg.payload is undefined in connectToUserDb function");
      const payload = JSON.parse(msg.payload);
      console.log(`Received DB update for user ${dbUserId}:`, payload);
      const {
        primaryKeyId,
        column,
        changes,
        timeStamp,
        tableName,
        operationType,
      } = payload;
      let lockKey = generateUserLockKey(
        dbUserId,
        tableName,
        primaryKeyId,
        column
      );

      const acquired = await acquireLock(lockKey);
      if (!acquired) {
        console.log(
          `Cant acquire lock for this change of event for dbUserId: ${dbUserId}`
        );
        return; // "Lock already acquired, request discarded"
      }
      // Forward data to Google Sheet updating RabbitMQ queue
      const data = {
        dbUserId,
        tableName,
        operationType,
        timeStamp,
        primaryKeyId,
        columnName: column,
        changes,
      };

      console.log("Received data to send to SheetQueue: ");
      console.log(data);
      await sendToQueue(sheetChannel, "sheetQueue", data); // Sheet queue

      // Release lock after processing
      await releaseLock(lockKey);
      console.log(
        `Released the lock after sending data to sheet Queue for dbUserId: ${dbUserId}`
      );
    });
  } catch (err) {
    console.error(
      "Error processing connection to db or while listening triggered events from db",
      err
    );
  }
}

// Close and remove user database connection
export async function closeUserDbConnection(dbUserId: any) {
  const dbClient = userDbClients[dbUserId];
  if (dbClient) {
    try {
      await dbClient.end(); // Close the PostgreSQL connection
      delete userDbClients[dbUserId]; // Remove client from the active list
      console.log(`Database connection for user ${dbUserId} closed.`);
    } catch (err) {
      console.error(`Failed to close DB connection for user ${dbUserId}:`, err);
    }
  }
}
