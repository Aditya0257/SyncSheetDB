import { getUserConfig } from "../config/dbUserConfig";

export async function checkUserConfig(req: any, res: any, next: any) {
    try {
      const dbUserId = req.headers["x-user-id"];
      console.log(`Going to check config for dbUserId: ${dbUserId} - running "checkUserConfig" func.`);
      const userConfig = await getUserConfig(dbUserId);
      if (!userConfig) {
        console.log(`Not found user config for dbUserId: ${dbUserId}!`);
        return res.status(400).json({ error: `User config not found for dbUserId: ${dbUserId}` });
      }
  
      next();
    } catch (err) {
      console.error("Error fetching user config: ", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }