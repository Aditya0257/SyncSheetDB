const handleDatabaseOperation = async (pgClient, payload) => {
  try {

    const primaryKeyValue = payload.primaryKeyId; // Expect this to be the UUID for userId
    let operationType = payload.operationType;
    if (!primaryKeyValue || primaryKeyValue == "") operationType = "INSERT";  
    const columnName = payload.columnName; // Column to update, e.g., "name"
    const newChangeValue = payload.newChangeValue; // New value for the column

    if (operationType === "UPDATE") {

      try {
        console.log("GOING TO RUN UPDATE OPERATION !!!");
        console.log("_____________________________________");
        // First, check if the userId exists
        const checkQuery = `SELECT COUNT(*) FROM testUsers WHERE userId = $1`;
        const checkResult = await pgClient.query(checkQuery, [primaryKeyValue]);

        if (checkResult.rows[0].count > 0) {
          // If the userId exists, perform the update
          const updateQuery = `UPDATE testUsers SET ${columnName} = $1 WHERE userId = $2`;
          await pgClient.query(updateQuery, [newChangeValue, primaryKeyValue]);
          console.log(
            `Database updated: ${columnName} set to ${newChangeValue} for userId ${primaryKeyValue}`
          );
          return { success: true, message: "Update successful" };
        } else {
          throw Error(
            `Error occured while trying to update the row for this primaryKeyID: ${primaryKeyValue}`
          );
        }
      } catch (error) {
        console.log("Error while Updating in database: ", error);
        return {
          success: false,
          message: "Error during running update operation!",
        };
      }
    } else if (operationType == "INSERT") {
      // Since the userId does not exist, insert a new record and auto-generate UUID
      try {
        console.log("GOING TO RUN INSERT OPERATION !!!");
        console.log("_____________________________________");
        const insertQuery = `INSERT INTO testUsers (userId, ${columnName}) VALUES (DEFAULT, $1) RETURNING userId`;
        const result = await pgClient.query(insertQuery, [newChangeValue]);
        const newUserPrimaryKeyId = result.rows[0].userId;
        console.log(
          `New entry created: userId ${newUserPrimaryKeyId} with ${columnName} set to ${newChangeValue}`
        );
        return {
          success: true,
          message: "New entry created successfully",
          userId: newUserPrimaryKeyId,
        };
      } catch (err) {
        console.log("Error while Inserting in database: ", err);
        return {
          success: false,
          message: "Error during running insert operation!",
        };
      }
    }
  } catch (error) {
    console.log("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_");
    console.error("Error handling database operation:", error);
    console.log("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_");
    throw error; // Ensure the error propagates back to the calling function
  }
};

module.exports = handleDatabaseOperation;
