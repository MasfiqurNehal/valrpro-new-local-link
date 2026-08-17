const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

async function generateExcelReport() {
  const reportsDir = path.join(__dirname, "..", "cypress", "reports");
  const jsonsDir = path.join(reportsDir, ".jsons");
  const outputPath = path.join(reportsDir, "VALRPRO_Test_Execution_and_Bug_Report.xlsx");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const allTests = [];
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
            const specFile = result.file || result.fullFile || "unknown spec";
            
            const extractTestsFromSuite = (suite) => {
              if (suite.tests && suite.tests.length) {
                for (const test of suite.tests) {
                  allTests.push({
                    specFile,
                    suiteTitle: suite.title || "Root Suite",
                    title: test.title,
                    fullTitle: test.fullTitle || `${suite.title}: ${test.title}`,
                    state: (test.state || (test.pass ? "passed" : test.fail ? "failed" : "pending")).toUpperCase(),
                    duration: ((test.duration || 0) / 1000).toFixed(2),
                    errorMessage: test.err && test.err.message ? test.err.message : "",
                    stackTrace: test.err && test.err.estack ? test.err.estack : "",
                  });
                }
              }
              if (suite.suites && suite.suites.length) {
                for (const subSuite of suite.suites) {
                  extractTestsFromSuite(subSuite);
                }
              }
            };

            extractTestsFromSuite(result);
          }
        }
      } catch (err) {
        console.error(`Error reading Mochawesome JSON ${file}:`, err.message);
      }
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VALRPRO QA Automation Suite";
  workbook.created = new Date();

  // -------------------------------------------------------------
  // SHEET 1: EXECUTIVE SUMMARY
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Execution Summary");

  summarySheet.mergeCells("A1:E1");
  const mainHeader = summarySheet.getCell("A1");
  mainHeader.value = "VALR.PRO AUTOMATION TEST EXECUTION SUMMARY REPORT";
  mainHeader.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  mainHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  mainHeader.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 40;

  summarySheet.addRow([]);

  const total = aggregateStats.totalTests || allTests.length;
  const passed = aggregateStats.passes || allTests.filter((t) => t.state === "PASSED").length;
  const failed = aggregateStats.failures || allTests.filter((t) => t.state === "FAILED").length;
  const skipped = (aggregateStats.pending + aggregateStats.skipped) || allTests.filter((t) => t.state !== "PASSED" && t.state !== "FAILED").length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) + "%" : "N/A";
  const durationSec = (aggregateStats.totalDuration / 1000).toFixed(1) + " seconds";

  const summaryData = [
    ["Report Generated At", new Date().toLocaleString()],
    ["Total Specs Processed", aggregateStats.specsCount],
    ["Total Test Cases", total],
    ["Passed Tests", passed],
    ["Failed Tests", failed],
    ["Skipped / Pending Tests", skipped],
    ["Overall Pass Rate", passRate],
    ["Total Execution Time", durationSec],
  ];

  summarySheet.addRow(["Metric", "Value"]).font = { bold: true };
  summarySheet.getRow(3).values = ["METRIC", "VALUE"];
  summarySheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

  summaryData.forEach((row) => {
    const addedRow = summarySheet.addRow(row);
    if (row[0] === "Passed Tests") {
      addedRow.getCell(2).font = { bold: true, color: { argb: "FF16A34A" } };
    } else if (row[0] === "Failed Tests" && failed > 0) {
      addedRow.getCell(2).font = { bold: true, color: { argb: "FFDC2626" } };
    } else if (row[0] === "Overall Pass Rate") {
      addedRow.getCell(2).font = { bold: true };
    }
  });

  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 45;

  // -------------------------------------------------------------
  // SHEET 2: ALL TEST CASES REPORT
  // -------------------------------------------------------------
  const testsSheet = workbook.addWorksheet("Test Cases Report");
  
  testsSheet.addRow(["#", "Spec File", "Suite Name", "Test Case Title", "Status", "Duration (s)", "Error Details"]);
  const testsHeaderRow = testsSheet.getRow(1);
  testsHeaderRow.height = 25;
  testsHeaderRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  testsHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  testsHeaderRow.alignment = { vertical: "middle" };

  allTests.forEach((test, index) => {
    const row = testsSheet.addRow([
      index + 1,
      test.specFile,
      test.suiteTitle,
      test.title,
      test.state,
      test.duration,
      test.errorMessage,
    ]);

    const statusCell = row.getCell(5);
    statusCell.alignment = { horizontal: "center" };

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

  testsSheet.getColumn(1).width = 6;
  testsSheet.getColumn(2).width = 40;
  testsSheet.getColumn(3).width = 25;
  testsSheet.getColumn(4).width = 50;
  testsSheet.getColumn(5).width = 14;
  testsSheet.getColumn(6).width = 15;
  testsSheet.getColumn(7).width = 60;

  // -------------------------------------------------------------
  // SHEET 3: BUG REPORT (FAILED TESTS ONLY)
  // -------------------------------------------------------------
  const bugSheet = workbook.addWorksheet("Bug Report");
  bugSheet.addRow(["Bug ID", "Test Case Title", "Spec File", "Error Message", "Stack Trace / Root Cause", "Status"]);

  const bugHeaderRow = bugSheet.getRow(1);
  bugHeaderRow.height = 25;
  bugHeaderRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  bugHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  bugHeaderRow.alignment = { vertical: "middle" };

  const failedTests = allTests.filter((t) => t.state === "FAILED");

  if (failedTests.length === 0) {
    bugSheet.addRow(["N/A", "No failed tests detected in this execution run.", "", "", "", "PASSED"]);
  } else {
    failedTests.forEach((test, index) => {
      const bugId = `BUG-${String(index + 1).padStart(3, "0")}`;
      const row = bugSheet.addRow([
        bugId,
        test.title,
        test.specFile,
        test.errorMessage,
        test.stackTrace,
        "OPEN",
      ]);

      row.getCell(1).font = { bold: true, color: { argb: "FFB91C1C" } };
      row.getCell(6).font = { bold: true, color: { argb: "FFDC2626" } };
    });
  }

  bugSheet.getColumn(1).width = 12;
  bugSheet.getColumn(2).width = 45;
  bugSheet.getColumn(3).width = 35;
  bugSheet.getColumn(4).width = 45;
  bugSheet.getColumn(5).width = 65;
  bugSheet.getColumn(6).width = 12;

  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n✅ Excel Report successfully generated at: ${outputPath}\n`);
}

generateExcelReport().catch((err) => {
  console.error("Failed to generate Excel report:", err);
});
