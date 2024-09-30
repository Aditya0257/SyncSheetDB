import { redisLockClient } from "../config/redisConfig";

export async function acquireLock(key: string) {
    try {
      // Set the lock with NX (set only if not exists) and PX (expiry time in ms)
      const result = await redisLockClient.set(key, "locked", {
        NX: true,
        PX: 10000,
      });
  
      // If the result is null, the lock was not acquired
      return result === "OK"; // Redis returns "OK" when it successfully sets a key
    } catch (err) {
      // console.error("Error acquiring lock:", err);
      return false;
    }
  }

export async function releaseLock(key: string) {
  return redisLockClient.del(key);
}