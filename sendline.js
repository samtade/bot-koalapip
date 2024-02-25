require("dotenv").config();

const MessagingApiClient =
  require("@line/bot-sdk").messagingApi.MessagingApiClient;

const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

function sendLine(messages) {
  client.pushMessage({
    to: process.env.LINE_GROUP_ID,
    messages: [{ type: "text", text: messages }],
  });

  console.log(`sent msg:
  ${messages}
`);
}

module.exports = sendLine;
