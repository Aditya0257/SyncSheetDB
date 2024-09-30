const amqp = require("amqplib");
const { updateSheet } = require("./updateSheet.js");

// RabbitMQ Connection URL
const AMQP_URL = process.env.RABBITMQ_URL;

const sheetId = process.env.GOOGLE_SHEET_ID;

// Function to listen to RabbitMQ and process messages
async function listenToQueue() {
  let connection = null;
  let channel = null;
  try {
    connection = await amqp.connect(AMQP_URL);
    channel = await connection.createChannel();

    const queueName = "sheetQueue";

    await channel.assertQueue(queueName, { durable: true });

    console.log(`Waiting for messages in queue: ${queueName}`);

    channel.consume(
      queueName,
      async (message) => {
        if (message !== null) {
          const msgContent = JSON.parse(message.content.toString());
          console.log("Received message:", msgContent);

          const { primaryKeyId, columnName, changes, operationType } =
            msgContent; // Extract the necessary fields
          console.log("Changes to sync in sheet: ");
          console.log(changes);
          console.log("ColumnName in which change is to be synced: ");
          console.log(columnName);

          // Update the Google Sheet with the changes
          await updateSheet(
            sheetId,
            primaryKeyId,
            operationType,
            columnName,
            changes
          );

          // Acknowledge the message after processing
          channel.ack(message);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error listening to RabbitMQ:", error);
    try {
      console.log("Gracefully Shutting down connections.");

      if (channel) {
        await channel.close();
        console.log("sheetQueue channel closed.");
      }

      if (connection) {
        await connection.close();
        console.log("RabbitMQ connection closed.");
      }
    } catch (err) {
      console.error("Error closing RabbitMQ connection or channels:", err);
    }
  }
}

// Start listening to the queue
listenToQueue();
