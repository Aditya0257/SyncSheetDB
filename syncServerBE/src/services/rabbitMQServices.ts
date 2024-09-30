export async function sendToQueue(queueChannel: any, queueName: string, data: any) {
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