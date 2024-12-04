import { readFileSync } from "fs";
import { join, parse } from "path";

let memoizedInput: string[][] | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): string[][] {
  const file = readFileSync(join(__dirname, "input")).toString();
  const rawRows = file.split("\n");
  const rows = rawRows.map((r) => r.split(""));
  return rows;
}

function countXmasOccurances(rows: string[][]) {
  let xmasCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const item = row[colIndex];

      if (item === "X") {
        // there are 8 paths to walk

        // Horizontally - to the right
        if (
          rows[rowIndex]?.[colIndex + 1] === "M" &&
          rows[rowIndex]?.[colIndex + 2] === "A" &&
          rows[rowIndex]?.[colIndex + 3] === "S"
        ) {
          xmasCount++;
        }

        // Horizontally - to the left
        if (
          rows[rowIndex]?.[colIndex - 1] === "M" &&
          rows[rowIndex]?.[colIndex - 2] === "A" &&
          rows[rowIndex]?.[colIndex - 3] === "S"
        ) {
          xmasCount++;
        }

        // Vertically - down
        if (
          rows[rowIndex + 1]?.[colIndex] === "M" &&
          rows[rowIndex + 2]?.[colIndex] === "A" &&
          rows[rowIndex + 3]?.[colIndex] === "S"
        ) {
          xmasCount++;
        }

        // Vertically - up
        if (
          rows[rowIndex - 1]?.[colIndex] === "M" &&
          rows[rowIndex - 2]?.[colIndex] === "A" &&
          rows[rowIndex - 3]?.[colIndex] === "S"
        ) {
          xmasCount++;
        }

        // Diagonally - up right
        if (
          rows[rowIndex - 1]?.[colIndex + 1] === "M" &&
          rows[rowIndex - 2]?.[colIndex + 2] === "A" &&
          rows[rowIndex - 3]?.[colIndex + 3] === "S"
        ) {
          xmasCount++;
        }

        // Diagonally - up left
        if (
          rows[rowIndex - 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex - 2]?.[colIndex - 2] === "A" &&
          rows[rowIndex - 3]?.[colIndex - 3] === "S"
        ) {
          xmasCount++;
        }

        // Diagonally - down right
        if (
          rows[rowIndex + 1]?.[colIndex + 1] === "M" &&
          rows[rowIndex + 2]?.[colIndex + 2] === "A" &&
          rows[rowIndex + 3]?.[colIndex + 3] === "S"
        ) {
          xmasCount++;
        }

        // Diagonally - down left
        if (
          rows[rowIndex + 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex + 2]?.[colIndex - 2] === "A" &&
          rows[rowIndex + 3]?.[colIndex - 3] === "S"
        ) {
          xmasCount++;
        }
      }
    }
  }

  return xmasCount;
}

function countX_masOccurances(rows: string[][]) {
  let xmasCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const item = row[colIndex];

      if (item === "A") {
        // there are 4 paths to walk

        //  M - M
        //  - A -
        //  S - S
        if (
          rows[rowIndex - 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex - 1]?.[colIndex + 1] === "M" &&
          rows[rowIndex + 1]?.[colIndex - 1] === "S" &&
          rows[rowIndex + 1]?.[colIndex + 1] === "S"
        ) {
          xmasCount++;
        }

        //  S - M
        //  - A -
        //  S - M
        if (
          rows[rowIndex - 1]?.[colIndex - 1] === "S" &&
          rows[rowIndex - 1]?.[colIndex + 1] === "M" &&
          rows[rowIndex + 1]?.[colIndex - 1] === "S" &&
          rows[rowIndex + 1]?.[colIndex + 1] === "M"
        ) {
          xmasCount++;
        }

        //  S - S
        //  - A -
        //  M - M
        if (
          rows[rowIndex - 1]?.[colIndex - 1] === "S" &&
          rows[rowIndex - 1]?.[colIndex + 1] === "S" &&
          rows[rowIndex + 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex + 1]?.[colIndex + 1] === "M"
        ) {
          xmasCount++;
        }

        //  M - S
        //  - A -
        //  M - S
        if (
          rows[rowIndex - 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex - 1]?.[colIndex + 1] === "S" &&
          rows[rowIndex + 1]?.[colIndex - 1] === "M" &&
          rows[rowIndex + 1]?.[colIndex + 1] === "S"
        ) {
          xmasCount++;
        }
      }
    }
  }
  return xmasCount;
}

function part1() {
  console.log("Part 1");
  const rows = getInput();
  const count = countXmasOccurances(rows);
  console.log(count);
}

function part2() {
  console.log("Part 2");
  const rows = getInput();
  const count = countX_masOccurances(rows);
  console.log(count);
}

part1();
part2();
