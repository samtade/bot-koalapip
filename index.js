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

/**
 * @param {Array<string>} name
 * @param {string} url
 */
async function fetchData(url, name) {
  await openTab(url);
  await click(button("data"));

  const data = (await $("table.table-body").text())
    .split("\n")
    .map((i) => i.split("\t"));

  console.log(`${url} done...`);
  return [["day", ...name], ...data];
}

const uploadToSheet = require("./sheet");
const sendLine = require("./sendline");

function toNumber(value) {
  return parseFloat(value.replace(/,/g, ""));
}

(async () => {
  try {
    openBrowser;

    await openBrowser();
    await goto("https://op.responsive.net/lt/tu/entry.html");
    await write(process.env.OP_USERNAME, into(textBox(near("Team ID"))));
    await write(process.env.OP_PASSWORD, into(textBox(near("Password"))));
    await click(button("ok"));

    const currentContract = toNumber(process.env.CURRENT_CONTRACT);
    const dataPoint = {
      jobin: {
        desc: ["job arrivals"],
      },
      jobout: {
        desc: ["complete con1", "complete con2", "complete con3"],
      },
      jobt: {
        desc: ["leadtime con1", "leadtime con2", "leadtime con3"],
        warning: [
          (value) => (currentContract === 1 && toNumber(value) > 3 ? "🚨" : ""),
          (value) => (currentContract === 2 && toNumber(value) > 1 ? "🚨" : ""),
          (value) =>
            currentContract === 2 && toNumber(value) > 0.5 ? "🚨" : "",
        ],
      },
      jobq: {
        desc: ["queued job"],
        warning: [(value) => toNumber(value) > 0],
      },
      jobrev: {
        desc: ["rev/job con1", "rev/job con2", "rev/job con3"],
        warning: [
          (value) =>
            currentContract === 1 && toNumber(value) < 1000 ? "🚨" : "",
          (value) =>
            currentContract === 2 && toNumber(value) < 1300 ? "🚨" : "",
          (value) =>
            currentContract === 2 && toNumber(value) < 2000 ? "🚨" : "",
        ],
      },
      s1q: {
        desc: ["q station 1"],
        warning: [(value) => (toNumber(value) > 0 ? "🚨" : "")],
      },
      s2q: {
        desc: ["q station 2"],
        warning: [(value) => (toNumber(value) > 0 ? "🚨" : "")],
      },
      s3q: {
        desc: ["q station 3"],
        warning: [(value) => (toNumber(value) > 0 ? "🚨" : "")],
      },
      s1util: {
        desc: ["util. station 1"],
        warning: [(value) => (toNumber(value) > 0.9 ? "🚨" : "")],
      },
      s2util: {
        desc: ["util. station 2"],
        warning: [(value) => (toNumber(value) > 0.9 ? "🚨" : "")],
      },
      s3util: {
        desc: ["util. station 3"],
        warning: [(value) => (toNumber(value) > 0.9 ? "🚨" : "")],
      },
      cash: {
        desc: ["cash on hand"],
      },
      inv: {
        desc: ["inventory"],
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

      const data = last.slice(1);
      for (let i = 0; i < desc.length; i++) {
        const v = data[i];
        const d = desc[i];
        summaryMsg.push(
          `- ${d}: ${v} ${
            Array.isArray(warning) && warning[i] ? warning[i](v) : ""
          }`
        );
      }
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
    console.log(`done update at ${new Date()}`);
  }
})();
