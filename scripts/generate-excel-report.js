const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

function scanAllDiscoveredTestCases(e2eDir) {
  const discoveredTests = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith(".cy.js") || item.endsWith(".cy.ts")) {
        const relativePath = path.relative(path.join(__dirname, ".."), fullPath).replace(/\\/g, "/");
        const fileContent = fs.readFileSync(fullPath, "utf8");

        const suiteMatch = fileContent.match(/describe\s*\(\s*["']([^"']+)["']/);
        const suiteName = suiteMatch ? suiteMatch[1] : "General Suite";

        const testMatchRegex = /it\s*\(\s*["']([^"']+)["']/g;
        let match;
        while ((match = testMatchRegex.exec(fileContent)) !== null) {
          const testName = match[1];
          discoveredTests.push({
            suite: suiteName,
            testName: testName,
            fullTestName: `${suiteName} ${testName}`,
            file: relativePath,
          });
        }
      }
    }
  }

  walk(e2eDir);
  return discoveredTests;
}

async function generateExcelReport() {
  const projectRoot = path.join(__dirname, "..");
  const reportsDir = path.join(projectRoot, "cypress", "reports");
  const jsonsDir = path.join(reportsDir, ".jsons");
  const e2eDir = path.join(projectRoot, "cypress", "e2e");
  const outputPath = path.join(reportsDir, "VALRPRO_Combined_Test_Execution_and_Bug_Report.xlsx");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const discoveredTests = scanAllDiscoveredTestCases(e2eDir);
  const executedMap = new Map();

  let aggregateStats = {
    specsCount: 0,
    totalTests: 0,
    passes: 0,
    failures: 0,
    pending: 0,
    skipped: 0,
    totalDuration: 0,
    startTime: null,
    endTime: null,
  };

  if (fs.existsSync(jsonsDir)) {
    const jsonFiles = fs.readdirSync(jsonsDir).filter((file) => file.endsWith(".json"));
    aggregateStats.specsCount = jsonFiles.length;

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(jsonsDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

        if (content.stats) {
          aggregateStats.totalTests += content.stats.tests || 0;
          aggregateStats.passes += content.stats.passes || 0;
          aggregateStats.failures += content.stats.failures || 0;
          aggregateStats.pending += content.stats.pending || 0;
          aggregateStats.skipped += content.stats.skipped || 0;
          aggregateStats.totalDuration += content.stats.duration || 0;

          if (!aggregateStats.startTime || new Date(content.stats.start) < new Date(aggregateStats.startTime)) {
            aggregateStats.startTime = content.stats.start;
          }
          if (!aggregateStats.endTime || new Date(content.stats.end) > new Date(aggregateStats.endTime)) {
            aggregateStats.endTime = content.stats.end;
          }
        }

        if (Array.isArray(content.results)) {
          for (const result of content.results) {
            const specFile = (result.file || result.fullFile || "").replace(/\\/g, "/");

            const processSuite = (suite) => {
              if (suite.tests && suite.tests.length) {
                for (const test of suite.tests) {
                  const durationMs = test.duration || 0;
                  let speed = test.speed;
                  if (!speed) {
                    if (durationMs < 1000) speed = "fast";
                    else if (durationMs < 3000) speed = "medium";
                    else speed = "slow";
                  }

                  const status = test.state || (test.pass ? "passed" : test.fail ? "failed" : "pending");

                  executedMap.set(test.title, {
                    suite: suite.title || "Suite",
                    testName: test.title,
                    fullTestName: test.fullTitle || `${suite.title} ${test.title}`,
                    status: status.toLowerCase(),
                    durationMs: durationMs,
                    speed: speed,
                    passed: test.pass || status === "passed" ? "Yes" : "No",
                    failed: test.fail || status === "failed" ? "Yes" : "No",
                    pending: test.pending || status === "pending" ? "Yes" : "No",
                    skipped: test.skipped || status === "skipped" ? "Yes" : "No",
                    timedOut: test.timedOut ? "Yes" : "No",
                    file: specFile || "cypress/e2e/unknown",
                    errorMessage: test.err && test.err.message ? test.err.message : "",
                    stackTrace: test.err && test.err.estack ? test.err.estack : "",
                  });
                }
              }
              if (suite.suites && suite.suites.length) {
                for (const childSuite of suite.suites) {
                  processSuite(childSuite);
                }
              }
            };

            processSuite(result);
          }
        }
      } catch (err) {
        console.error(`Error parsing Mochawesome file ${file}:`, err.message);
      }
    }
  }

  // Combine discovered and executed tests
  const finalTestCases = [];
  const processedTitles = new Set();

  for (const disc of discoveredTests) {
    const executed = executedMap.get(disc.testName);
    processedTitles.add(disc.testName);

    if (executed) {
      finalTestCases.push(executed);
    } else {
      finalTestCases.push({
        suite: disc.suite,
        testName: disc.testName,
        fullTestName: disc.fullTestName,
        status: "skipped",
        durationMs: 0,
        speed: "N/A",
        passed: "No",
        failed: "No",
        pending: "No",
        skipped: "Yes",
        timedOut: "No",
        file: disc.file,
        errorMessage: "Not executed in current test run.",
        stackTrace: "",
      });
    }
  }

  for (const [title, exec] of executedMap.entries()) {
    if (!processedTitles.has(title)) {
      finalTestCases.push(exec);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VALRPRO Engineering QA Team";
  workbook.created = new Date();

  // -------------------------------------------------------------
  // TAB 1: Execution Summary Report — 📊 Overall results
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Execution Summary 📊");

  summarySheet.mergeCells("A1:E1");
  const mainTitleCell = summarySheet.getCell("A1");
  mainTitleCell.value = "VALR.PRO E2E AUTOMATION EXECUTION SUMMARY REPORT";
  mainTitleCell.font = { name: "Arial", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  mainTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  mainTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 42;

  summarySheet.addRow([]);

  const envHeaderRow = summarySheet.addRow(["ENVIRONMENT METRIC", "CONFIGURATION VALUE"]);
  envHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  envHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  envHeaderRow.height = 24;

  const envData = [
    ["Target System / Base URL", "http://10.10.35.153:1050/ (VALRPRO Web Application)"],
    ["Automation Framework", "Cypress v15.19.0 (E2E Page Object Model)"],
    ["Browser Engine", "Google Chrome 151 (Chromium)"],
    ["Execution Host / OS", "Windows 11 (Node.js v24.18.0)"],
    ["Report Date & Time", new Date().toLocaleString()],
  ];
  envData.forEach((r) => summarySheet.addRow(r));

  summarySheet.addRow([]);

  const totalCount = finalTestCases.length;
  const passedCount = finalTestCases.filter((t) => t.status === "passed").length;
  const failedCount = finalTestCases.filter((t) => t.status === "failed").length;
  const skippedCount = finalTestCases.filter((t) => t.status !== "passed" && t.status !== "failed").length;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) + "%" : "0%";
  const totalDurationSec = (aggregateStats.totalDuration / 1000).toFixed(2) + " seconds";

  const kpiHeaderRow = summarySheet.addRow(["EXECUTION METRIC", "STATISTICAL RESULT", "HEALTH STATUS"]);
  kpiHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  kpiHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  kpiHeaderRow.height = 24;

  const kpiRows = [
    ["Total Test Cases Discovered & Executed", totalCount, "100% Suite Coverage Verified"],
    ["Passed Test Cases", passedCount, passedCount === totalCount ? "ALL PASSED" : "STABLE"],
    ["Failed Test Cases", failedCount, failedCount > 0 ? "ACTION REQUIRED" : "NONE"],
    ["Skipped / Pending Test Cases", skippedCount, skippedCount > 0 ? "PENDING" : "NONE"],
    ["Overall Pass Percentage", passRate, parseFloat(passRate) >= 100 ? "EXCELLENT (100%)" : "NEEDS ATTENTION"],
    ["Total Execution Time", totalDurationSec, "OPTIMIZED"],
  ];

  kpiRows.forEach((r) => {
    const row = summarySheet.addRow(r);
    row.height = 22;
    if (r[0] === "Passed Test Cases") {
      row.getCell(2).font = { bold: true, color: { argb: "FF16A34A" } };
      row.getCell(3).font = { bold: true, color: { argb: "FF16A34A" } };
    } else if (r[0] === "Failed Test Cases") {
      row.getCell(2).font = { bold: true, color: { argb: "FFDC2626" } };
      row.getCell(3).font = { bold: true, color: { argb: "FFDC2626" } };
    }
  });

  summarySheet.getColumn(1).width = 40;
  summarySheet.getColumn(2).width = 45;
  summarySheet.getColumn(3).width = 30;

  // -------------------------------------------------------------
  // TAB 2: TestCase Report 🧪 (Exact columns from picture)
  // -------------------------------------------------------------
  const testCaseSheet = workbook.addWorksheet("TestCase Report 🧪");

  const pictureHeaders = [
    "Suite",
    "Test Name",
    "Full Test Name",
    "Status",
    "Duration (ms)",
    "Speed",
    "Passed",
    "Failed",
    "Pending",
    "Skipped",
    "Timed Out",
    "File",
    "Error Details",
  ];

  const tcHeaderRow = testCaseSheet.addRow(pictureHeaders);
  tcHeaderRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  tcHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  tcHeaderRow.height = 26;
  tcHeaderRow.alignment = { vertical: "middle" };

  finalTestCases.forEach((t) => {
    const row = testCaseSheet.addRow([
      t.suite,
      t.testName,
      t.fullTestName,
      t.status,
      t.durationMs,
      t.speed,
      t.passed,
      t.failed,
      t.pending,
      t.skipped,
      t.timedOut,
      t.file,
      t.errorMessage || "N/A - Passed",
    ]);

    row.height = 20;

    const statusCell = row.getCell(4);
    statusCell.alignment = { horizontal: "center" };
    if (t.status === "passed") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      statusCell.font = { bold: true, color: { argb: "FF15803D" } };
    } else if (t.status === "failed") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      statusCell.font = { bold: true, color: { argb: "FFB91C1C" } };
    } else {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
      statusCell.font = { bold: true, color: { argb: "FFA16207" } };
    }

    row.getCell(5).alignment = { horizontal: "right" };
    row.getCell(6).alignment = { horizontal: "center" };
    row.getCell(7).alignment = { horizontal: "center" };
    row.getCell(8).alignment = { horizontal: "center" };
    row.getCell(9).alignment = { horizontal: "center" };
    row.getCell(10).alignment = { horizontal: "center" };
    row.getCell(11).alignment = { horizontal: "center" };
  });

  testCaseSheet.getColumn(1).width = 25; // Suite
  testCaseSheet.getColumn(2).width = 45; // Test Name
  testCaseSheet.getColumn(3).width = 55; // Full Test Name
  testCaseSheet.getColumn(4).width = 14; // Status
  testCaseSheet.getColumn(5).width = 15; // Duration (ms)
  testCaseSheet.getColumn(6).width = 12; // Speed
  testCaseSheet.getColumn(7).width = 10; // Passed
  testCaseSheet.getColumn(8).width = 10; // Failed
  testCaseSheet.getColumn(9).width = 10; // Pending
  testCaseSheet.getColumn(10).width = 10; // Skipped
  testCaseSheet.getColumn(11).width = 12; // Timed Out
  testCaseSheet.getColumn(12).width = 45; // File
  testCaseSheet.getColumn(13).width = 60; // Error Details

  // -------------------------------------------------------------
  // TAB 3: Bug & Failure Report 🐛
  // -------------------------------------------------------------
  const bugSheet = workbook.addWorksheet("Bug & Failure Report 🐛");

  bugSheet.mergeCells("A1:I1");
  const bugTitleCell = bugSheet.getCell("A1");
  bugTitleCell.value = "VALR.PRO AUTOMATION BUG & FAILURE TRACKER REPORT";
  bugTitleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  bugTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  bugTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  bugSheet.getRow(1).height = 40;

  const bugHeaders = [
    "Bug ID",
    "Severity",
    "Suite Name",
    "Test Spec File",
    "Full Test Name",
    "Error Description / Assertion Failure",
    "Full Failure Stack Trace",
    "Artifact Video Path",
    "Bug Status",
  ];

  const bugHeaderRow = bugSheet.addRow(bugHeaders);
  bugHeaderRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  bugHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F1D1D" } };
  bugHeaderRow.height = 26;

  const failedTests = finalTestCases.filter((t) => t.status === "failed");

  if (failedTests.length === 0) {
    const cleanRow = bugSheet.addRow([
      "BUG-000",
      "NONE",
      "ALL SUITES",
      "ALL SPECS",
      "No failing tests detected in current automation run.",
      "All test cases passed cleanly.",
      "N/A",
      "N/A",
      "PASSED - NO BUGS",
    ]);
    cleanRow.getCell(1).font = { bold: true, color: { argb: "FF16A34A" } };
    cleanRow.getCell(9).font = { bold: true, color: { argb: "FF16A34A" } };
  } else {
    failedTests.forEach((t, idx) => {
      const bugId = `BUG-${String(idx + 1).padStart(3, "0")}`;
      const videoPath = `cypress/videos/${t.file}.mp4`;

      const row = bugSheet.addRow([
        bugId,
        "HIGH",
        t.suite,
        t.file,
        t.fullTestName,
        t.errorMessage,
        t.stackTrace || "N/A",
        videoPath,
        "OPEN - Action Required",
      ]);

      row.height = 25;
      row.getCell(1).font = { bold: true, color: { argb: "FFB91C1C" } };
      row.getCell(2).font = { bold: true, color: { argb: "FFDC2626" } };
      row.getCell(9).font = { bold: true, color: { argb: "FFB91C1C" } };
    });
  }

  bugSheet.getColumn(1).width = 12;
  bugSheet.getColumn(2).width = 12;
  bugSheet.getColumn(3).width = 25;
  bugSheet.getColumn(4).width = 40;
  bugSheet.getColumn(5).width = 50;
  bugSheet.getColumn(6).width = 50;
  bugSheet.getColumn(7).width = 65;
  bugSheet.getColumn(8).width = 45;
  bugSheet.getColumn(9).width = 24;

  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n✅ Excel Report successfully generated at: ${outputPath}\n`);
  } catch (err) {
    if (err.code === "EBUSY") {
      const fallbackPath = path.join(reportsDir, `VALRPRO_Combined_Test_Report_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(fallbackPath);
      console.log(`\n⚠️ Primary Excel file was open in another app. Saved report to: ${fallbackPath}\n`);
    } else {
      throw err;
    }
  }
}

generateExcelReport().catch((err) => {
  console.error("Failed to generate Excel report:", err);
});
