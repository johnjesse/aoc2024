import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

let memoizedInput: number[] | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): number[] {
  const data = readFileSync(join(__dirname, "input")).toString();
  return data.split(" ").map((value) => parseInt(value, 10));
}

function blinkAt(stone: number): number[] {
  if (stone === 0) {
    return [1];
  }

  const stringNum = stone.toString();

  if (stringNum.length % 2 === 0) {
    const firstHalf = stringNum.slice(0, stringNum.length / 2);
    const secondHalf = stringNum.slice(stringNum.length / 2);

    return [firstHalf, secondHalf].map((value) => parseInt(value, 10));
  }

  const multipliedStone = stone * 2024;

  if (multipliedStone > Number.MAX_SAFE_INTEGER) {
    console.warn("Getting to unsafe integer values, time to use bigint");
  }

  return [multipliedStone];
}

function blink(
  stone: number,
  times: number,
  lookup: Map<string, number>
): number {
  if (times === 0) {
    return 1;
  }

  const stored = lookup.get(`${stone}-${times}`);

  if (stored) {
    return stored;
  }

  if (times === 1) {
    return blinkAt(stone).length;
  }

  let sum = 0;

  for (const newStone of blinkAt(stone)) {
    const newStoneScore = blink(newStone, times - 1, lookup);
    lookup.set(`${newStone}-${times - 1}`, newStoneScore);
    sum = sum + newStoneScore;
  }

  return sum;
}

function part1() {
  console.log("Part 1");
  const startTime = Date.now();
  const stones = getInput();
  let sum = 0;

  const lookup = new Map<string, number>();

  for (const stone of stones) {
    sum = sum + blink(stone, 25, lookup);
  }

  console.log(lookup.size);

  console.log(sum);
  const endTime = Date.now();
  console.log(endTime - startTime);
}

function part2() {
  console.log("Part 2");
  const stones = getInput();
  let sum = 0;

  const lookup = new Map<string, number>();
  for (const stone of stones) {
    sum = sum + blink(stone, 75, lookup);
  }

  console.log(lookup.size);

  console.log(sum);
}

part1();
part2();
