import { readFileSync } from "fs";
import { join, parse } from "path";

let memoizedInput: Data | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

interface Data {
  rules: number[][];
  manuals: number[][];
}

function parseInput(): Data {
  const rulesData = readFileSync(join(__dirname, "input", "rules")).toString();
  const rulesRaw = rulesData.split("\n");
  const rules = rulesRaw.map((r) =>
    r.split("|").map((value) => parseInt(value))
  );

  const manualsData = readFileSync(
    join(__dirname, "input", "manuals")
  ).toString();
  const manualsRaw = manualsData.split("\n");
  const manuals = manualsRaw.map((r) =>
    r.split(",").map((value) => parseInt(value))
  );
  return { rules, manuals };
}

function isManualInOrder(manual: number[], rules: number[][]) {
  for (const rule of rules) {
    const beforePage = rule[0];
    const afterPage = rule[1];

    const beforePagePosition = manual.findIndex((page) => page === beforePage);
    const afterPagePosition = manual.findIndex((page) => page === afterPage);

    if (
      beforePage !== -1 &&
      afterPagePosition !== -1 &&
      afterPagePosition < beforePagePosition
    ) {
      return false;
    }
  }

  return true;
}

function getOrderedManuals({ manuals, rules }: Data) {
  return manuals.filter((manual) => isManualInOrder(manual, rules));
}

function getUnOrderedManuals({ manuals, rules }: Data) {
  return manuals.filter((manual) => !isManualInOrder(manual, rules));
}

function reOrderManual(manual: number[], rules: number[][]) {
  return manual.toSorted((pageA, pageB) => {
    const rule = rules.find(
      (rule) =>
        (rule[0] === pageA && rule[1] === pageB) ||
        (rule[0] === pageB && rule[1] === pageA)
    );

    if (!rule) {
      console.log(
        `No rule found for pages ${pageA} ${pageB} in manual ${manual}`
      );
      // in this case leave them in the current order
      return -1;
    }

    return rule[0] === pageA ? -1 : 1;
  });
}

function countMiddlePagesOfManuals(manuals: number[][]) {
  return manuals
    .map((manual) => manual[Math.floor(manual.length / 2)])
    .reduce((acc, next) => acc + next, 0);
}

function part1() {
  console.log("Part 1");
  const { rules, manuals } = getInput();
  const correctlyOrderedManuals = getOrderedManuals({ rules, manuals });
  const sumOfMiddlePageNumbers = countMiddlePagesOfManuals(
    correctlyOrderedManuals
  );
  console.log(sumOfMiddlePageNumbers);
}

function part2() {
  console.log("Part 2");
  const { rules, manuals } = getInput();
  const incorrectlyOrderedManuals = getUnOrderedManuals({ rules, manuals });
  const reOrderedManuals = incorrectlyOrderedManuals.map((manual) =>
    reOrderManual(manual, rules)
  );
  const sumOfMiddlePageNumbers = countMiddlePagesOfManuals(reOrderedManuals);
  console.log(sumOfMiddlePageNumbers);
}

part1();
part2();
