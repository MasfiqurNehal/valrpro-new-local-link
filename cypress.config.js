const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

const loggerFilePath = path.join(__dirname, "logger.txt");
const accountsFilePath = path.join(__dirname, "cypress", "fixtures", "accounts.json");

function truncateValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  let text;

  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch (error) {
      text = String(value);
    }
  }

  if (text.length > 2000) {
    return `${text.slice(0, 2000)}...`;
  }

  return text;
}

function formatLogEntry(entry = {}) {
  const parts = [`[${new Date().toISOString()}]`, `[event=${entry.event || "EVENT"}]`];

  if (entry.spec) {
    parts.push(`[spec=${truncateValue(entry.spec)}]`);
  }

  if (entry.test) {
    parts.push(`[test=${truncateValue(entry.test)}]`);
  }

  if (entry.method) {
    parts.push(`[method=${truncateValue(entry.method)}]`);
  }

  if (entry.url) {
    parts.push(`[url=${truncateValue(entry.url)}]`);
  }

  if (entry.status !== undefined && entry.status !== null) {
    parts.push(`[status=${truncateValue(entry.status)}]`);
  }

  const payload = entry.details !== undefined ? entry.details : entry.info;

  if (payload !== undefined && payload !== null && payload !== "") {
    parts.push(`[details=${truncateValue(payload)}]`);
  }

  return parts.join(" ");
}

function loadPrimaryAccount(desiredAccountId) {
  if (!fs.existsSync(accountsFilePath)) {
    return null;
  }

  try {
    const accounts = JSON.parse(fs.readFileSync(accountsFilePath, "utf8"));
    if (!Array.isArray(accounts) || !accounts.length) {
      return null;
    }

    const selectedAccount =
      desiredAccountId
        ? accounts.find((account) => account && (account.id === desiredAccountId || account.email === desiredAccountId))
        : accounts[0];

    if (!selectedAccount || !selectedAccount.email || !selectedAccount.password) {
      return null;
    }

    return {
      id: selectedAccount.id || selectedAccount.email,
      email: selectedAccount.email,
      password: selectedAccount.password,
    };
  } catch (error) {
    return null;
  }
}

module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  // Required to reach into Stripe Checkout's nested cross-origin iframe
  // (js.stripe.com) that renders the actual card form.
  chromeWebSecurity: false,

  screenshotsFolder: "cypress/screenshots",
  videosFolder: "cypress/videos",
  downloadsFolder: "cypress/downloads",

  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports",
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportPageTitle: "VALR.PRO E2E Bug Report",
  },

  viewportWidth: 1440,
  viewportHeight: 900,

  defaultCommandTimeout: 10000,
  pageLoadTimeout: 60000,

  e2e: {
    baseUrl: "http://10.10.35.153:1050/",
    experimentalModifyObstructiveThirdPartyCode: true,

    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);

      on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.family === "chromium" || browser.name === "chrome") {
          launchOptions.args.push("--disable-web-security");
          launchOptions.args.push("--disable-site-isolation-trials");
          launchOptions.args.push("--disable-features=IsolateOrigins,site-per-process");
        }
        return launchOptions;
      });

      on("before:run", (details) => {
        const shouldAppend = Boolean(config.env.loggerAppend);
        const baseUrl = config.baseUrl || (config.e2e && config.e2e.baseUrl);
        const header = [
          "==================================================",
          formatLogEntry({
            event: "RUN_START",
            details: {
              browser: details.browser && details.browser.name,
              configFile: details.configFile,
              cypressVersion: details.cypressVersion,
              baseUrl,
              accountId: config.env.accountId,
              accountEmail: config.env.accountEmail,
            },
          }),
        ].join("\n");

        if (shouldAppend && fs.existsSync(loggerFilePath)) {
          fs.appendFileSync(loggerFilePath, `\n${header}\n`, "utf8");
        } else {
          fs.writeFileSync(loggerFilePath, `${header}\n`, "utf8");
        }
      });

      on("after:run", (details) => {
        fs.appendFileSync(
          loggerFilePath,
          `${formatLogEntry({
            event: "RUN_END",
            details: {
              totalTests: details.totalTests,
              totalPassed: details.totalPassed,
              totalFailed: details.totalFailed,
              totalPending: details.totalPending,
              totalSkipped: details.totalSkipped,
              duration: details.totalDuration,
            },
          })}\n`,
          "utf8"
        );

        try {
          const { execSync } = require("child_process");
          execSync("node scripts/generate-excel-report.js", { stdio: "ignore" });
        } catch (err) {
          // ignore report script failure in hook
        }
      });

      on("task", {
        "accounts:get"(desiredAccountId) {
          return loadPrimaryAccount(desiredAccountId);
        },
        log(message) {
          console.log(message);
          return null;
        },
        "logger:append"(message) {
          const line = typeof message === "string" ? message : formatLogEntry(message);
          fs.appendFileSync(loggerFilePath, `${line}\n`, "utf8");
          return null;
        },
        "logger:reset"() {
          fs.writeFileSync(loggerFilePath, "", "utf8");
          return null;
        },
      });
      return config;
    },
  },
});
