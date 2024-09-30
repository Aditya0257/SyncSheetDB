import { getAllUserConfigs } from "../utils/getAllUserConfigs";
import { connectToUserDb } from "./dbService";

export async function reconnectToAllUserDbs() {
  try {
    // Fetch all user configs stored in Redis
    const dbUserIdsArray = await getAllUserConfigs();
    console.log(dbUserIdsArray);
    
    if (dbUserIdsArray) {
      // Loop over each user config and reconnect to the respective DB
      for (const dbUserId of dbUserIdsArray) {
        console.log(`Reconnecting to DB for user ${dbUserId}`);
        await connectToUserDb(dbUserId);
      }
    } else {
      console.log("No user configurations found in Redis");
    }
  } catch (err) {
    console.error("Error reconnecting to user databases:", err);
  }
}
