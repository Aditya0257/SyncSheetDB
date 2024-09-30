const { google } = require("googleapis");

// Google Service Account Key Path
const GOOGLE_SERVICE_ACCOUNT_KEY_PATH = "./config/project_creds.json";

// Function to initialize Google Sheets API client
async function initializeSheets() {
  const auth = await google.auth.getClient({
    keyFile: GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Function to update a specific cell in Google Sheet
async function updateSheet(sheetId, primaryKeyId, operationType, columnName, changes) {
  const sheets = await initializeSheets();
  try {
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1", // Adjust the sheet name if necessary
    });

    const rows = getResponse.data.values;

    if (operationType == "INSERT") {
      // need to insert data in each column of the particular row

      // changes: {
      //   bio: null,
      //   name: '',
      //   email: null,
      //   userId: 'fec4b07e-f221-4827-8a9d-34c9acd9af1a',
      //   password: null
      // }

      // Prepare a new row from changes object
      const newRow = [
        primaryKeyId, // Assuming primaryKeyId goes in the first column
        changes.name || "", // Add more fields as necessary
        changes.email || "",
        changes.bio || "",
        changes.password || "",
        // Add any other fields you want to insert
      ];

       // Get the last row index (0-based)
       const lastRowIndex = rows.length - 1;
 
       // Update the last row instead of appending
       await sheets.spreadsheets.values.update({
         spreadsheetId: sheetId,
         range: `Sheet1!A${lastRowIndex + 1}:Z${lastRowIndex + 1}`, // Adjust range to your sheet size
         valueInputOption: "RAW",
         requestBody: {
           values: [newRow],
         },
       });

      console.log(`New row added successfully for userId ${primaryKeyId}`);
      return;
    }

    if (rows.length) {
      // Find the column index for the specified `columnName` in the first row
      const headers = rows[0];
      const columnIndex = headers.indexOf(columnName);

      if (columnIndex === -1) {
        throw new Error(`Column '${columnName}' not found in the sheet.`);
      }

      // Find the row with the matching `primaryKeyId` in the first column
      let rowIndex = -1;
      rows.some((row, index) => {
        if (index > 0 && row[0] === primaryKeyId) {
          // PrimaryKeyId is in the first column
          rowIndex = index;
          return true;
        }
        return false;
      });

      if (rowIndex === -1) {
        throw new Error(
          `Primary key '${primaryKeyId}' not found in the sheet.`
        );
      }

      // Update the specific cell
      const updatedRow = [...rows[rowIndex]]; // Copy current row values
      updatedRow[columnIndex] = changes[columnName]; // Update only the specified column

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Sheet1!A${rowIndex + 1}:Z${rowIndex + 1}`, // Adjust range to your sheet size
        valueInputOption: "RAW",
        requestBody: {
          values: [updatedRow],
        },
      });

      console.log(
        `Cell updated successfully at row ${rowIndex + 1}, column ${
          columnIndex + 1
        }`
      );
    } else {
      console.log("No data right now!");
    }
  } catch (error) {
    console.error("Error updating sheet:", error);
  }
}

module.exports = {
  updateSheet
};
