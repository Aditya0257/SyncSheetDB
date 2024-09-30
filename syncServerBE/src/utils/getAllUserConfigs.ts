import { redisClient } from "../config/redisConfig";

export async function getAllUserConfigs() {
  try {
    const keys = await redisClient.keys("user:*"); // Assuming keys are stored with a prefix like "userConfig:dbUserId"

    if (keys.length === 0) {
      return null;
    }

    const dbUserKeys = [];
    for (const key of keys) {
      const userConfig = await redisClient.get(key);
      if (userConfig) {
        // console.log(`dbConfig of dbUser with key: ${key}: `)
        // console.log(userConfig);
        const dbUserId = key.split(':')[1];
        dbUserKeys.push(dbUserId); 
      }
    }

    return dbUserKeys;
  } catch (err) {
    console.error("Error fetching user configs from Redis:", err);
    throw err;
  }
}
