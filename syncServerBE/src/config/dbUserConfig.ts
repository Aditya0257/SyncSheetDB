import { Client } from "pg";
import { redisClient } from "./redisConfig";

// Track active PostgreSQL connections by userId
export const userDbClients: { [key: string]: Client } = {};

// Store user config in Redis (Google Sheet URL and DB config)
export async function storeUserConfig(
  dbUserId: any,
  dbConfig: any,
  tableName: string
) {
  try {
    // Store user configuration including the column mapping in Redis
    const config = JSON.stringify({ dbConfig });
    console.log("Setting this new userId in Redis: ", dbUserId);
    await redisClient.set(`user:${dbUserId}`, config);
  } catch (error) {
    console.error("Error storing configuration's for this dbUserId: ", error);
  }
}

// Retrieve user config from Redis
export async function getUserConfig(dbUserId: any) {

  const config = await redisClient.get(`user:${dbUserId}`);
  if (config) {

    // console.log(
    //   "dbSheetSync service current user's config (dbUser's Config): "
    // );
    // console.log(JSON.parse(config));
    console.log(`dbUserId: ${dbUserId}'s database configuration found by running "getUserConfig" func`);
  
  } else {
    console.log(
      "This dbUserId doesnt have configurations stored in Redis => returning with null config value."
    );
  }

  return config ? JSON.parse(config) : null;
}

export async function removeUserConfig(dbUserId: any) {
  await redisClient.del(`user:${dbUserId}`);
  console.log("Successfully deleted the user config for dbUserId: ", dbUserId);
}
