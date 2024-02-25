require("dotenv").config();

const { google } = require("googleapis");
const sendLine = require("./sendline");
const sheets = google.sheets("v4");
const credentials = require(process.env.SERVICE_ACCOUNT_CRED);

async function checkNoti(dataObject) {
  // Set up the JWT client
  const client = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  // Load client and spreadsheet
  client.authorize(async (err) => {
    if (err) {
      console.error("Authorization error:", err);
      return;
    }

    // Get the ID of your Google Sheet from the URL
    const spreadsheetId = "1KBbX7ll5KiFnjAJ9PFnHohqEuHPvfL_T9cmShmejtYo"; // Replace with your actual spreadsheet ID
    const range = "data!A1:D219"; // Replace with the desired range

    // Read values from the sheet
    const response = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (rows.length) {
      const currentDatetime = new Date();
      currentDatetime.setSeconds(0);
      console.log("Data:");
      rows.forEach(([dt, , , msg]) => {
        if (!msg) {
          return;
        }

        console.log(`${dt}: ${msg}`);
        const specificDatetime = new Date(dt);
        specificDatetime.setSeconds(0);

        if (specificDatetime.getTime() === currentDatetime.getTime()) {
          console.log(`  >> Sent data: ${msg}`);
          sendLine(msg);
        }
      });
    } else {
      console.log("No data found.");
    }
    console.log(`done update at ${new Date()}`);
  });
}

checkNoti();
