import { removeUserConfig } from "../config/dbUserConfig";
import { closeUserDbConnection } from "../services/dbService";

export const removeDbUserConfig = async (req: any, res: any) => {
    const dbUserId = req.headers["x-user-id"];
  
    try {
      await removeUserConfig(dbUserId);
      await closeUserDbConnection(dbUserId); // Close the DB connection when config is removed
      console.log(`Successfully removed user config for dbUserId: ${dbUserId} by running "removeDbUserConfig" func.`);
      res.status(200).json({ message: "User config removed successfully" });
    } catch (err) {
      console.error("Error removing user config:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }