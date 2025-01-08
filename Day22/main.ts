import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

function parseInput(): bigint[] {
  const input = readFileSync(join(__dirname, "input")).toString();

  const codes = input.split("\n").map((v) => BigInt(parseInt(v, 10)));

  return codes;
}

function mixNumbers(valueA: bigint, valueB: bigint): bigint {
  return valueA ^ valueB;
}

function pruneNumber(value: bigint): bigint {
  return value % 16777216n;
}

function evolveSecretNumber(value: bigint): bigint {
  // Step 1 - Multiply by 64, mix and prune
  const step1Value = pruneNumber(mixNumbers(value * 64n, value));

  // Step 2 - Divide by 32 - round down, mix and prune
  const step2Value = pruneNumber(mixNumbers(step1Value / 32n, step1Value));

  // Step 3 - Multiply by 2048, mix and prune
  const step3Value = pruneNumber(mixNumbers(step2Value * 2048n, step2Value));

  return step3Value;
}

function evolveNTimes(value: bigint, times: number) {
  for (let i = 1; i <= times; i++) {
    value = evolveSecretNumber(value);
  }

  return value;
}

function getPrices(secret: bigint, evolutions: number): number[] {
  const prices: number[] = [getFinalDigitAsNumber(secret)];

  for (let i = 1; i <= evolutions; i++) {
    secret = evolveSecretNumber(secret);
    prices.push(getFinalDigitAsNumber(secret));
  }

  return prices;
}

function getKey(...values: number[]) {
  return values.map((v) => v.toString()).join(",");
}

function getInstructionsAndSellingValues(
  prices: number[]
): Map<string, number> {
  const sellingValues = new Map();

  for (let i = 4; i < prices.length; i++) {
    const key = getKey(
      prices[i - 3] - prices[i - 4],
      prices[i - 2] - prices[i - 3],
      prices[i - 1] - prices[i - 2],
      prices[i] - prices[i - 1]
    );

    if (!sellingValues.has(key)) {
      sellingValues.set(key, prices[i]);
    }
  }

  return sellingValues;
}

function getBestInstuction(
  sellingValueLookups: Map<string, number>[]
): [string, number] {
  const allInstructions = new Map<string, number>();

  for (const lookup of sellingValueLookups) {
    for (const [key, value] of lookup.entries()) {
      allInstructions.set(key, (allInstructions.get(key) ?? 0) + value);
    }
  }

  let bestInstruction = "";
  let bestInstructionScore = 0;

  for (const [key, value] of allInstructions.entries()) {
    if (value > bestInstructionScore) {
      bestInstructionScore = value;
      bestInstruction = key;
    }
  }

  return [bestInstruction, bestInstructionScore];
}

function getFinalDigitAsNumber(value: bigint): number {
  const strValue = value.toString();
  return parseInt(strValue.substring(strValue.length - 1), 10);
}

function part1() {
  console.log("Part 1");
  const secrets = parseInput();
  const finalSecrets = secrets.map((s) => evolveNTimes(s, 2000));
  const sum = finalSecrets.reduce((acc, next) => acc + next, 0n);
  console.log(sum);
}

function part2() {
  console.log("Part 2");
  const secrets = parseInput();
  const prices = secrets.map((s) => getPrices(s, 2000));
  const sellingValues = prices.map((p) => getInstructionsAndSellingValues(p));

  const [instruction, value] = getBestInstuction(sellingValues);
  console.log(instruction, value);
}

part1();
part2();
