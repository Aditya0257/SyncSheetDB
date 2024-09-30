import { getUserConfig, storeUserConfig } from "../config/dbUserConfig";
import { connectToUserDb } from "../services/dbService";

export const storeDbUserConfig = async (req: any, res: any) => {
  const dbUserId = req.headers["x-user-id"];
  const { dbConfig, tableName } = req.body;

  try {
    // Check if the user config already exists in Redis
    const existingConfig = await getUserConfig(dbUserId);

    if (existingConfig) {
      return res
        .status(400)
        .json({ message: "User configuration already exists." });
    }

    // Store the user config in Redis
    console.log(
      `Going to store this new user's id (dbUserId: ${dbUserId}) and DB configurations using "storeUserConfig" func.`
    );
    await storeUserConfig(dbUserId, dbConfig, tableName);
    // Connect to the user's database
    console.log(
      `Going to connect this new user (dbUserId: ${dbUserId})  using "connectToUserDb" func.`
    );
    await connectToUserDb(dbUserId);

    res.status(200).json({ message: "User config stored and DB connected." });
  } catch (err) {
    console.error("Error storing user config or connecting to DB:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
