require("dotenv").config();

const { google } = require("googleapis");
const sheets = google.sheets("v4");
const credentials = require(process.env.SERVICE_ACCOUNT_CRED);

function uploadToSheet(dataObject) {
  // Set up the JWT client
  const client = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  // Load client and spreadsheet
  client.authorize((err) => {
    if (err) {
      console.error("Authorization error:", err);
      return;
    }

    // Replace 'yourSpreadsheetId' with the ID of your Google Sheet
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    Object.entries(dataObject).forEach(([sheetName, dataValue]) => {
      // Append the data to the sheet
      sheets.spreadsheets.values.update(
        {
          auth: client,
          spreadsheetId,
          range: sheetName,
          valueInputOption: "RAW",
          resource: {
            values: dataValue,
          },
        },
        (err, response) => {
          if (err) {
            console.error("The API returned an error:", err);
            return;
          }
          console.log("Data appended successfully:", response.data);
        }
      );
    });
    console.log("done update");
  });
}

module.exports = uploadToSheet;
