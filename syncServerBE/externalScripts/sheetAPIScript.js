function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const newValue = range.getValue();
  const timestamp = new Date();

  const newChangeValue = newValue.toString();
  const operationType = "UPDATE";
  const primaryKeyId = sheet.getRange(range.getRow(), 1).getValue().toString();
  const columnName = sheet.getRange(1, range.getColumn()).getValue().toString();

  const payload = {
    sheetName: sheet.getName(),
    primaryKeyId: primaryKeyId,
    columnName: columnName,
    row: range.getRow(),
    column: range.getColumn(),
    newChangeValue: newChangeValue,
    timeStamp: timestamp.toISOString(),
    operationType: operationType,
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'x-user-id': '<your dbUserId>', // Your user ID
    },
  };

  const webhookUrl = "http://<your aws ec2 instance of hosted syncServerBE's ip>:3100/api/google-sheet-webhook";

  try {
    // Send the webhook notification
    const response = UrlFetchApp.fetch(webhookUrl, options);
    
    // Log the response to understand if there are errors
    Logger.log('Response: ' + response.getContentText());
  } catch (error) {
    // Log any errors for troubleshooting
    Logger.log('Error: ' + error.message);
  }
}
