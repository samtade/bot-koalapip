require("dotenv").config();

const {
  openBrowser,
  goto,
  near,
  textBox,
  into,
  write,
  button,
  click,
  openTab,
  $,
  closeBrowser,
} = require("taiko");

function urlData(data) {
  return `https://op.responsive.net/Littlefield/Plot?data=${data}&x=all`;
}

async function fetchData(url, name) {
  await openTab(url);
  await click(button("data"));

  const data = (await $("table.table-body").text())
    .split("\n")
    .map((i) => i.split("\t"));

  console.log(`${url} done...`);
  return [["day", name], ...data];
}

const uploadToSheet = require("./sheet");
const sendLine = require("./sendline");

(async () => {
  try {
    openBrowser;

    await openBrowser();
    await goto("https://op.responsive.net/lt/tu/entry.html");
    await write(process.env.OP_USERNAME, into(textBox(near("Team ID"))));
    await write(process.env.OP_PASSWORD, into(textBox(near("Password"))));
    await click(button("ok"));

    const dataPoint = {
      jobin: {
        desc: "job arrivals",
      },
      jobout: {
        desc: "job complete",
      },
      jobt: {
        desc: "job leadtime",
        warning: (value) => Number(value) > 3,
      },
      jobq: {
        desc: "queued job",
        warning: (value) => Number(value) > 0,
      },
      jobrev: {
        desc: "revenue",
        warning: (value) => Number(value) < 1000,
      },
      s1q: {
        desc: "q station 1",
        warning: (value) => Number(value) > 0,
      },
      s2q: {
        desc: "q station 2",
        warning: (value) => Number(value) > 0,
      },
      s3q: {
        desc: "q station 3",
        warning: (value) => Number(value) > 0,
      },
      s1util: {
        desc: "util. station 1",
        warning: (value) => Number(value) > 0.9,
      },
      s2util: {
        desc: "util. station 2",
        warning: (value) => Number(value) > 0.9,
      },
      s3util: {
        desc: "util. station 3",
        warning: (value) => Number(value) > 0.9,
      },
      inv: {
        desc: "inventory",
      },
    };

    let summaryMsg = [];
    let updateSheetData = {};
    for (let [key, { desc, warning }] of Object.entries(dataPoint)) {
      updateSheetData[key] = await fetchData(urlData(key.toUpperCase()), desc);

      const last = updateSheetData[key][updateSheetData[key].length - 1];
      if (!summaryMsg.length) {
        summaryMsg.push(`📝 รายงานข้อมูลวันที่ ${last[0]}`);
      }

      summaryMsg.push(
        `- ${desc}: ${last[1]} ${warning && warning(last[1]) ? "😱" : ""}`
      );
    }

    sendLine(summaryMsg.join("\n"));

    const updated = [["last_updated"], [new Date().toString()]];
    uploadToSheet({
      updated,
      ...updateSheetData,
    });
  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
