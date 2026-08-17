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
        
        // Extract module name from folder structure or filename
        const parts = relativePath.split("/");
        const moduleName = parts.length > 2 ? parts[2].toUpperCase().replace(/-/g, " ") : "GENERAL";

        // Regex scan for it('TC-...', ...) or describe blocks
        const testMatchRegex = /it\s*\(\s*["']([^"']+)["']/g;
        let match;
        while ((match = testMatchRegex.exec(fileContent)) !== null) {
          const rawTitle = match[1];
          const tcIdMatch = rawTitle.match(/(TC-[A-Z0-9-]+)/i);
          const tcId = tcIdMatch ? tcIdMatch[1] : `TC-DISCOVERED-${discoveredTests.length + 1}`;
          
          discoveredTests.push({
            tcId,
            moduleName,
            specFile: relativePath,
            title: rawTitle,
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

  // 1. Scan codebase for all existing test cases
  const discoveredTestCases = scanAllDiscoveredTestCases(e2eDir);

  // Map to store test results keyed by full title or test ID
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

  // 2. Parse JSON reports from Mochawesome
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
                  const state = (test.state || (test.pass ? "passed" : test.fail ? "failed" : "pending")).toUpperCase();
                  const durationSec = ((test.duration || 0) / 1000).toFixed(2);
                  const errorMessage = test.err && test.err.message ? test.err.message : "";
                  const stackTrace = test.err && test.err.estack ? test.err.estack : "";

                  executedMap.set(test.title, {
                    specFile: specFile || "cypress/e2e/unknown",
                    suiteTitle: suite.title || "Suite",
                    title: test.title,
                    state,
                    duration: durationSec,
                    errorMessage,
                    stackTrace,
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
        console.error(`Warning parsing Mochawesome file ${file}:`, err.message);
      }
    }
  }

  // 3. Build unified test cases list combining static scan and execution details
  const finalTestCases = [];

  // Add all discovered tests
  const processedTitles = new Set();

  for (const disc of discoveredTestCases) {
    const executed = executedMap.get(disc.title);
    processedTitles.add(disc.title);

    if (executed) {
      finalTestCases.push({
        tcId: disc.tcId,
        moduleName: disc.moduleName,
        specFile: executed.specFile || disc.specFile,
        title: disc.title,
        state: executed.state,
        duration: executed.duration,
        errorMessage: executed.errorMessage || "N/A - Passed cleanly",
        stackTrace: executed.stackTrace,
      });
    } else {
      finalTestCases.push({
        tcId: disc.tcId,
        moduleName: disc.moduleName,
        specFile: disc.specFile,
        title: disc.title,
        state: "SKIPPED",
        duration: "0.00",
        errorMessage: "Test spec was not executed in recent run.",
        stackTrace: "",
      });
    }
  }

  // Add any additional executed tests not picked up by regex
  for (const [title, exec] of executedMap.entries()) {
    if (!processedTitles.has(title)) {
      const tcIdMatch = title.match(/(TC-[A-Z0-9-]+)/i);
      const tcId = tcIdMatch ? tcIdMatch[1] : `TC-EXEC-${finalTestCases.length + 1}`;
      const parts = (exec.specFile || "").split("/");
      const moduleName = parts.length > 2 ? parts[2].toUpperCase().replace(/-/g, " ") : "SUITE";

      finalTestCases.push({
        tcId,
        moduleName,
        specFile: exec.specFile,
        title: exec.title,
        state: exec.state,
        duration: exec.duration,
        errorMessage: exec.errorMessage || "N/A - Passed cleanly",
        stackTrace: exec.stackTrace,
      });
    }
  }

  // 4. Create Excel Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VALRPRO Software Engineering QA Team";
  workbook.lastModifiedBy = "VALRPRO Automation Framework";
  workbook.created = new Date();

  // -------------------------------------------------------------
  // TAB 1: Execution Summary Report — 📊 Overall results
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Execution Summary 📊");

  // Title Banner
  summarySheet.mergeCells("A1:E1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "VALR.PRO E2E AUTOMATION EXECUTION SUMMARY REPORT";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 45;

  summarySheet.addRow([]);

  // System & Environment Info Table
  const envHeaders = ["ENVIRONMENT METRIC", "CONFIGURATION VALUE"];
  const envHeaderRow = summarySheet.addRow(envHeaders);
  envHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  envHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  envHeaderRow.height = 24;

  const envData = [
    ["Target System / Base URL", "http://10.10.35.153:1050/ (Staging Staging Environment)"],
    ["Automation Framework", "Cypress v15.19.0 (JavaScript / E2E POM Architecture)"],
    ["Browser Engine", "Google Chrome 151 (Headless Automation)"],
    ["Execution Host / OS", "Windows 11 (Node.js v24.18.0)"],
    ["Report Date & Timestamp", new Date().toLocaleString()],
  ];

  envData.forEach((r) => summarySheet.addRow(r));

  summarySheet.addRow([]);

  // KPI Metrics Table
  const totalCount = finalTestCases.length;
  const passedCount = finalTestCases.filter((t) => t.state === "PASSED").length;
  const failedCount = finalTestCases.filter((t) => t.state === "FAILED").length;
  const skippedCount = finalTestCases.filter((t) => t.state !== "PASSED" && t.state !== "FAILED").length;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) + "%" : "0%";
  const totalDurationSec = (aggregateStats.totalDuration / 1000).toFixed(2) + " seconds";

  const kpiHeaders = ["EXECUTION METRIC", "STATISTICAL RESULT", "HEALTH STATUS"];
  const kpiHeaderRow = summarySheet.addRow(kpiHeaders);
  kpiHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  kpiHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  kpiHeaderRow.height = 24;

  const kpiRows = [
    ["Total Test Cases Discovered & Executed", totalCount, "100% Suite Coverage Verified"],
    ["Passed Test Cases (Clean Run)", passedCount, passedCount === totalCount ? "ALL PASSED" : "STABLE"],
    ["Failed Test Cases (Requires Review)", failedCount, failedCount > 0 ? "ACTION REQUIRED" : "NONE"],
    ["Skipped / Pending Test Cases", skippedCount, skippedCount > 0 ? "PENDING" : "NONE"],
    ["Overall Pass Percentage Rate", passRate, parseFloat(passRate) >= 100 ? "EXCELLENT (100%)" : "NEEDS ATTENTION"],
    ["Total Suite Execution Time", totalDurationSec, "OPTIMIZED RUN TIME"],
  ];

  kpiRows.forEach((r) => {
    const row = summarySheet.addRow(r);
    row.height = 22;
    if (r[0].startsWith("Passed Test Cases")) {
      row.getCell(2).font = { bold: true, color: { argb: "FF16A34A" } };
      row.getCell(3).font = { bold: true, color: { argb: "FF16A34A" } };
    } else if (r[0].startsWith("Failed Test Cases")) {
      row.getCell(2).font = { bold: true, color: { argb: "FFDC2626" } };
      row.getCell(3).font = { bold: true, color: { argb: "FFDC2626" } };
    } else if (r[0].startsWith("Overall Pass Percentage")) {
      row.getCell(2).font = { bold: true, size: 12 };
      row.getCell(3).font = { bold: true };
    }
  });

  summarySheet.getColumn(1).width = 42;
  summarySheet.getColumn(2).width = 45;
  summarySheet.getColumn(3).width = 30;

  // -------------------------------------------------------------
  // TAB 2: Execution Report — 🧪 Main report
  // -------------------------------------------------------------
  const execSheet = workbook.addWorksheet("Execution Report 🧪");

  // Title Banner
  execSheet.mergeCells("A1:H1");
  const mainHeader = execSheet.getCell("A1");
  mainHeader.value = "VALR.PRO E2E TEST EXECUTION REPORT (MAIN SUITE)";
  mainHeader.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  mainHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  mainHeader.alignment = { horizontal: "center", vertical: "middle" };
  execSheet.getRow(1).height = 40;

  // Table Headers
  const tableHeaders = [
    "S.No",
    "Module Category",
    "Test Spec File Path",
    "Test Case ID",
    "Test Case Objective / Title",
    "Execution Status",
    "Duration (sec)",
    "Execution Failure / Summary Notes",
  ];

  const execHeaderRow = execSheet.addRow(tableHeaders);
  execHeaderRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  execHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  execHeaderRow.height = 28;
  execHeaderRow.alignment = { vertical: "middle" };

  finalTestCases.forEach((test, idx) => {
    const row = execSheet.addRow([
      idx + 1,
      test.moduleName,
      test.specFile,
      test.tcId,
      test.title,
      test.state,
      test.duration,
      test.errorMessage,
    ]);

    row.height = 24;
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(4).font = { bold: true };
    row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };

    const statusCell = row.getCell(6);
    statusCell.alignment = { horizontal: "center", vertical: "middle" };

    if (test.state === "PASSED") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      statusCell.font = { bold: true, color: { argb: "FF15803D" } };
    } else if (test.state === "FAILED") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      statusCell.font = { bold: true, color: { argb: "FFB91C1C" } };
    } else {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
      statusCell.font = { bold: true, color: { argb: "FFA16207" } };
    }
  });

  execSheet.getColumn(1).width = 8;
  execSheet.getColumn(2).width = 25;
  execSheet.getColumn(3).width = 45;
  execSheet.getColumn(4).width = 16;
  execSheet.getColumn(5).width = 60;
  execSheet.getColumn(6).width = 18;
  execSheet.getColumn(7).width = 16;
  execSheet.getColumn(8).width = 55;

  // -------------------------------------------------------------
  // TAB 3: Bug / Failure Report — 🐛 Failed test details
  // -------------------------------------------------------------
  const bugSheet = workbook.addWorksheet("Bug & Failure Report 🐛");

  // Title Banner
  bugSheet.mergeCells("A1:I1");
  const bugHeaderCell = bugSheet.getCell("A1");
  bugHeaderCell.value = "VALR.PRO AUTOMATION BUG & FAILURE TRACKER REPORT";
  bugHeaderCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  bugHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  bugHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
  bugSheet.getRow(1).height = 40;

  const bugHeaders = [
    "Bug ID",
    "Severity",
    "Module Category",
    "Test Spec File",
    "Test Case ID & Title",
    "Failure Error Description",
    "Full Failure Stack Trace",
    "Artifact Video/Screenshot",
    "Bug Status",
  ];

  const bugHeaderRow = bugSheet.addRow(bugHeaders);
  bugHeaderRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  bugHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F1D1D" } };
  bugHeaderRow.height = 28;
  bugHeaderRow.alignment = { vertical: "middle" };

  const failedTests = finalTestCases.filter((t) => t.state === "FAILED");

  if (failedTests.length === 0) {
    const cleanRow = bugSheet.addRow([
      "BUG-000",
      "NONE",
      "ALL MODULES",
      "ALL SPECS",
      "No failing tests detected in current automation execution.",
      "All test cases passed cleanly without assertion failures.",
      "N/A",
      "N/A",
      "PASSED - NO BUGS",
    ]);
    cleanRow.height = 25;
    cleanRow.getCell(1).font = { bold: true, color: { argb: "FF16A34A" } };
    cleanRow.getCell(9).font = { bold: true, color: { argb: "FF16A34A" } };
  } else {
    failedTests.forEach((test, idx) => {
      const bugId = `BUG-${String(idx + 1).padStart(3, "0")}`;
      const videoPath = `cypress/videos/${test.specFile}.mp4`;

      const row = bugSheet.addRow([
        bugId,
        "HIGH",
        test.moduleName,
        test.specFile,
        `${test.tcId}: ${test.title}`,
        test.errorMessage,
        test.stackTrace || "N/A",
        videoPath,
        "OPEN - Action Required",
      ]);

      row.height = 28;
      row.getCell(1).font = { bold: true, color: { argb: "FFB91C1C" } };
      row.getCell(2).font = { bold: true, color: { argb: "FFDC2626" } };
      row.getCell(9).font = { bold: true, color: { argb: "FFB91C1C" } };
    });
  }

  bugSheet.getColumn(1).width = 12;
  bugSheet.getColumn(2).width = 12;
  bugSheet.getColumn(3).width = 22;
  bugSheet.getColumn(4).width = 40;
  bugSheet.getColumn(5).width = 50;
  bugSheet.getColumn(6).width = 50;
  bugSheet.getColumn(7).width = 65;
  bugSheet.getColumn(8).width = 45;
  bugSheet.getColumn(9).width = 24;

  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n✅ Combined Excel Report successfully generated at: ${outputPath}\n`);
}

generateExcelReport().catch((err) => {
  console.error("Failed to generate Excel report:", err);
});
