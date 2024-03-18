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
  evaluate,
} = require("taiko");
var pull = require("lodash.pull");
var sortBy = require("lodash.sortby");

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
    .map((i) => i.split("\t").map(toNumber));

  console.log(`${url} done...`);
  return [["day", ...name], ...data];
}

const uploadToSheet = require("./sheet");
const sendLine = require("./sendline");

function toNumber(value) {
  if (!value) {
    return value;
  }

  return parseFloat(value.replace(/,/g, ""));
}

async function updateStanding(t, day) {
  t[0] = `🏆 ประกาศอันดับ วันที่${day}`;

  console.log(JSON.stringify(t));

  const msgLine = t
    .map((tt) =>
      tt
        .replace(/^1\t/, "🥇\t")
        .replace(/^2\t/, "🥈\t")
        .replace(/^3\t/, "🥉\t")
        .replace("koalapip", "🐨koalapip")
    )
    .join("\n");
  sendLine(msgLine);

  const teams = [];
  const revs = [];
  for (let i of sortBy(
    t.map((i) => i.split("\t").slice(1)),
    [0]
  )) {
    teams.push(i[0]);
    revs.push(toNumber(i[1]));
  }

  console.log(JSON.stringify([teams, revs]));
  teams[0] = "day";
  // uploadToSheet({ [`standing!A1`]: [teams] });
  uploadToSheet({ [`standing!A1`]: [[day, ...revs]] }, "append");

  return msgLine;
}

async function startCrawling() {
  try {
    await openBrowser();
    await goto("https://op.responsive.net/lt/tu/entry.html");
    await write(process.env.OP_USERNAME, into(textBox(near("Team ID"))));
    await write(process.env.OP_PASSWORD, into(textBox(near("Password"))));
    await click(button("ok"));

    await evaluate(() => {
      openOverallStandingDialog();
    });
    const standingTableString = await $("#standingTable").text();
    await click($("[title=close]"));
    const t = standingTableString.split("\n");
    pull(t, "", "\t");

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
          (value) => (currentContract === 1 && value > 3 ? "🚨" : ""),
          (value) => (currentContract === 2 && value > 1 ? "🚨" : ""),
          (value) => (currentContract === 3 && value > 0.5 ? "🚨" : ""),
        ],
      },
      jobq: {
        desc: ["queued job"],
        warning: [(value) => value > 0],
      },
      jobrev: {
        desc: ["rev/job con1", "rev/job con2", "rev/job con3"],
        warning: [
          (value) => (currentContract === 1 && value < 1000 ? "🚨" : ""),
          (value) => (currentContract === 2 && value < 1300 ? "🚨" : ""),
          (value) => (currentContract === 3 && value < 2000 ? "🚨" : ""),
        ],
      },
      s1q: {
        desc: ["q station 1"],
        warning: [(value) => (value > 200 ? "🚨" : "")],
      },
      s2q: {
        desc: ["q station 2"],
        warning: [(value) => (value > 200 ? "🚨" : "")],
      },
      s3q: {
        desc: ["q station 3"],
        warning: [(value) => (value > 200 ? "🚨" : "")],
      },
      s1util: {
        desc: ["util. station 1"],
        warning: [(value) => (value > 0.9 ? "🚨" : "")],
      },
      s2util: {
        desc: ["util. station 2"],
        warning: [(value) => (value > 0.9 ? "🚨" : "")],
      },
      s3util: {
        desc: ["util. station 3"],
        warning: [(value) => (value > 0.9 ? "🚨" : "")],
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
    let day = 0;
    for (let [key, { desc, warning }] of Object.entries(dataPoint)) {
      updateSheetData[key] = await fetchData(urlData(key.toUpperCase()), desc);

      const last = updateSheetData[key][updateSheetData[key].length - 1];
      if (!summaryMsg.length) {
        day = last[0];
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

    const updated = [["last_updated"], [new Date().toString()]];
    uploadToSheet({
      updated,
      ...updateSheetData,
    });

    const standingLineMsg = await updateStanding(t, day);

    sendLine(summaryMsg.join("\n") + "\n\n" + standingLineMsg);
  } catch (error) {
    console.error(error);

    sendLine("ลาป่วย 1 วัน");
  } finally {
    await closeBrowser();
    console.log(`done update at ${new Date()}`);
  }
}

startCrawling();
