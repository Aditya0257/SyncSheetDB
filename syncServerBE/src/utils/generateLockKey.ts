// Generate Redis lock key ->
// Since each user can have multiple tables, and sheet displays one table at a time
// so tableName == sheetName for locking a value by primaryKeyId and columnName,
// as both can be same for same dbUserId in diff TableName, right now, ignoring it, since this
// prototype is being run currently with very few users, so high chance of no clash in locked user data key in redis
export default function generateUserLockKey(dbUserId: string, tableName: string, primaryKeyId: string, columnName: string) {
    return `lock:${dbUserId}:${primaryKeyId}:${columnName}`;
  }