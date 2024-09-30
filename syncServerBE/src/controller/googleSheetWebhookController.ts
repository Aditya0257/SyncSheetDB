import { dbChannel } from "../config/rabbitMQConfig";
import { sendToQueue } from "../services/rabbitMQServices";
import { acquireLock, releaseLock } from "../services/redisServices";
import generateUserLockKey from "../utils/generateLockKey";

export const googleSheetWebhook = async (req: any, res: any) => {
  const {
    sheetName,
    operationType,
    timeStamp,
    primaryKeyId,
    columnName,
    newChangeValue,
  } = req.body;

  const dbUserId = req.headers["x-user-id"];

  try {
    console.log("Reached googleSheetWebhook controller fn");

    let lockKey = generateUserLockKey(
      dbUserId,
      sheetName,
      primaryKeyId,
      columnName
    );

    // Acquire lock before processing
    const acquired = await acquireLock(lockKey);
    if (!acquired) {
      return res
        .status(409)
        .json({ message: "Lock already acquired, request discarded" });
    }
    console.log(
      `Acquired the lock with Key: ${lockKey} before pushing data to dbQueue.`
    );

    // Forward data to DB updating RabbitMQ queue
    const data = {
      dbUserId,
      sheetName,
      operationType,
      timeStamp,
      primaryKeyId,
      columnName,
      newChangeValue,
    };
    console.log("Data to be sent to dbQueue: ");
    console.log(data);

    /* 
    Difference in newChangeValue and changes used in functions =>
    newChangeValue -> corrosponds to single cell updated value, from DB side event, whole new row can also be inserted
    so changes in connectToUserDb function can have more than 1 values, but newChangeValue always stays a single cell updated value.
    */

    await sendToQueue(dbChannel, "dbQueue", data); // Database queue

    // Release lock after processing
    await releaseLock(lockKey);
    console.log(
      `Released the lock for Key: ${lockKey} after pushing data to dbQueue.`
    );
    // Received update (via webhook url which was run by sheet by triggering onEdit event when some data was updated in any cell in sheet) and passed to db Rabbit MQ
    res.status(200).json({
      message: `Received update regarding sheet's any cell update and passed it to db Rabbit MQ for dbUserId: ${dbUserId}.`,
    });
  } catch (err) {
    console.error(
      `Error while running "googleSheetWebhook" func for dbUserId: ${dbUserId} to listen/receive update from googleSheet:`,
      err
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};
