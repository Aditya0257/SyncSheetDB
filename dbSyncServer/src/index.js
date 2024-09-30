// Import necessary modules
require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const amqp = require("amqplib/callback_api");
const handleDatabaseOperation = require("./dbOperation");

const app = express();
const PORT = 3200;

// PostgreSQL connection
const pgClient = new Client({
  connectionString: process.env.DB_CONNECTION_STRING,
});

pgClient
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("PostgreSQL connection error:", err));

// RabbitMQ connection and consumer setup
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = "dbQueue";

amqp.connect(RABBITMQ_URL, (err, connection) => {
  if (err) {
    console.error("Failed to connect to RabbitMQ:", err);
    return;
  }
  console.log("Connected to RabbitMQ");

  connection.createChannel((err, channel) => {
    if (err) {
      console.error("Failed to create a channel:", err);
      return;
    }

    channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`Waiting for messages in queue: ${QUEUE_NAME}`);
    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          console.log("Received message:", msg.content.toString());
          let payload;
          payload = JSON.parse(msg.content.toString());
          try {
            payload = JSON.parse(msg.content.toString());
          } catch (error) {
            console.error("Error parsing message:", error);
            channel.ack(msg); // Acknowledge the message to prevent re-delivery
            return;
          }
          
          // console.log(
          //   `Payload message after parsing: ${JSON.stringify(payload)}`
          // );

          // const primaryKeyId = payload.primaryKeyId; // e.g., "user_id"
          // console.log(primaryKeyId)

          // Calling the function to handle the database operation
          try {
            const result = await handleDatabaseOperation(pgClient, payload); // Passing the pgClient and payload to the function
            channel.ack(msg); // Acknowledge message after processing
            // Check the result and send the appropriate response
            if (result.success) {
              console.log("Success! : )");
            } else {
              console.log("Failure! : /");
            }
          } catch (error) {
            console.error("Error processing database operation:", error);
          }
        }
      },
      {
        noAck: false,
      }
    );
  });
});

// Express routes
app.use(express.json());

app.get("/*", (req, res) => {
  res.send("Hello, World!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port no: ${PORT}`);
});
