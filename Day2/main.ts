import { readFileSync } from "fs";
import { join } from "path";

type Report = number[];
type Reports = Report[];

let memoizedInput: Reports | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Reports {
  const file = readFileSync(join(__dirname, "input")).toString();

  const lines = file.split("\n");

  const reports: Report[] = [];

  for (const line of lines) {
    const rawReport = line.split(" ");
    reports.push(rawReport.map((item) => parseInt(item, 10)));
  }

  return reports;
}

type ReportType = "increasing" | "decreasing";

function isValidItemPair(
  item1: number,
  item2: number,
  type: ReportType
): boolean {
  switch (type) {
    case "decreasing":
      return item1 > item2 && item1 - item2 <= 3;
    case "increasing":
      return item2 > item1 && item2 - item1 <= 3;
  }
}

function isValidReport(report: Report): boolean {
  let firstItem = report.shift()!;
  let secondItem = report.shift()!;

  if (firstItem === secondItem) {
    return false;
  }

  const reportType = firstItem < secondItem ? "increasing" : "decreasing";

  if (!isValidItemPair(firstItem, secondItem, reportType)) {
    return false;
  }

  let previousItem = secondItem;

  const isInvalid = report.some((item) => {
    const isInValid = !isValidItemPair(previousItem, item, reportType);
    previousItem = item;
    return isInValid;
  });

  return !isInvalid;
}

function getTotalValidReports(reports: Report[]): number {
  return reports
    .map((report) => isValidReport([...report]))
    .filter((valid) => valid).length;
}

function getValidReportsWithProblemDampening(reports: Report[]): number {
  const total = reports
    .map((report) => {
      const isValid = isValidReport([...report]);

      if (isValid) {
        return isValid;
      }

      // This is a little brute force - for simplicity we iterate through the array
      // removing a single item at a time and see if it is now valid.
      //
      // It might be nicer to be clever and localise the fiddling around where we found the
      // first problem in the array - but it's simpler and easier to understand this way - and it works
      for (let index = 0; index < report.length; index++) {
        const dampenedReport = report.toSpliced(index, 1);
        const isValidWhenDampened = isValidReport(dampenedReport);
        if (isValidWhenDampened) {
          return isValidWhenDampened;
        }
      }

      return isValid;
    })
    .filter((valid) => valid).length;

  return total;
}

function part1() {
  console.log("Part 1");
  const reports = getInput();
  const totalValidReports = getTotalValidReports(reports);
  console.log(totalValidReports);
}

function part2() {
  console.log("Part 2");
  const reports = getInput();
  const totalValidReports = getValidReportsWithProblemDampening(reports);
  console.log(totalValidReports);
}

part1();
part2();
