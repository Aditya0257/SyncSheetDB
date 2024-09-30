import dotenv from "dotenv";
dotenv.config();

import amqp from 'amqplib';

// RabbitMQ channels for DB and Sheet queues
export let dbChannel: amqp.Channel | null = null;
export let sheetChannel: amqp.Channel | null = null;
let conn: amqp.Connection | null = null;

export async function connectRabbitMQ() {
  try {
    // const rabbitMqUrl = process.env.RABBITMQ_URL;
    const rabbitMqUrl = process.env.RABBITMQ_URL;
    if(!rabbitMqUrl) throw Error('rabbitMqUrl is undefined!');
    conn = await amqp.connect(rabbitMqUrl);
    dbChannel = await conn.createChannel();
    sheetChannel = await conn.createChannel();

    await dbChannel.assertQueue('dbQueue', { durable: true });
    await sheetChannel.assertQueue('sheetQueue', { durable: true });

    console.log('RabbitMQ connection and channels established.');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
    throw err;
  }
}

export async function disconnectRabbitMQ() {
  try {
    // Close DB channel if it exists
    if (dbChannel) {
      await dbChannel.close();
      console.log('dbChannel closed.');
    }

    // Close Sheet channel if it exists
    if (sheetChannel) {
      await sheetChannel.close();
      console.log('sheetChannel closed.');
    }

    // Close RabbitMQ connection
    if (conn) {
      await conn.close();
      console.log('RabbitMQ connection closed.');
    }
  } catch (err) {
    console.error('Error closing RabbitMQ connection or channels:', err);
  }
}



  