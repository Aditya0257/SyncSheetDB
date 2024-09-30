import pg from "pg";
import express from "express";
import generateUserLockKey from "../utils/generateLockKey";
import { acquireLock, releaseLock } from "../services/redisServices";
import amqp from "amqplib";

const app = express();
app.use(express.json());

export let dbChannel: amqp.Channel | null = null;
export let sheetChannel: amqp.Channel | null = null;

export async function connectRabbitMQ() {
  try {
    // const rabbitMqUrl = process.env.RABBITMQ_URL;
    const rabbitMqUrl =
      "amqps://zjprsxjk:rqY_CG6IckU0ueOXvDsXc6BOQ3VPLx96@puffin.rmq2.cloudamqp.com/zjprsxjk";
    if (!rabbitMqUrl) throw Error("rabbitMqUrl is undefined!");
    const conn = await amqp.connect(rabbitMqUrl);
    dbChannel = await conn.createChannel();
    sheetChannel = await conn.createChannel();

    await dbChannel.assertQueue("dbQueue", { durable: true });
    await sheetChannel.assertQueue("sheetQueue", { durable: true });

    console.log("RabbitMQ connection and channels established.");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
    throw err;
  }
}

connectRabbitMQ();

// Main function for running single fix User for this service (dbUserId: 'Aditya1985')
export async function connectToUserDb_fix_dbUserId() {
  // Set up the PostgreSQL client
  const dbClient = new pg.Client({
    connectionString:
      "postgresql://neondb_owner:mnjI1ogKzL0l@ep-billowing-morning-a1mxxto4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  });

  dbClient.connect();

  // Listen for notifications on the 'user_update' channel
  dbClient.query("LISTEN db_update_channel");

  dbClient.on("notification", async (msg) => {
    const dbUserId = "Aditya1985";
    console.log("In the event!");
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
      column,
    );
    // const acquired = await acquireLock(lockKey);
    // if (!acquired) {
    //   return; // "Lock already acquired, request discarded"
    // }
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
    console.log("Pushed to queue");
    // Release lock after processing
    // await releaseLock(lockKey);
  });
}

export async function sendToQueue(
  queueChannel: any,
  queueName: string,
  data: any
) {
  try {
    if (!queueChannel) {
      console.error(`RabbitMQ channel for ${queueName} not initialized`);
      return;
    }

    queueChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
    console.log(`Message sent to ${queueName}:`, data);
  } catch (err) {
    console.error(`Failed to send message to ${queueName}:`, err);
  }
}

app.listen(4000, () => {
  console.log("Server started!");
});
