import { readFileSync } from "fs";
import { join } from "path";

interface Lists {
  listA: number[];
  listB: number[];
}

let memoizedInput: Lists | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Lists {
  const file = readFileSync(join(__dirname, "input")).toString();

  const lines = file.split("\n");

  const listA: number[] = [];
  const listB: number[] = [];

  for (const line of lines) {
    const [first, second] = line.split("   ");
    listA.push(parseInt(first, 10));
    listB.push(parseInt(second, 10));
  }

  return { listA, listB };
}

type Pairs = [number, number][];

function convertListsToPairs(lists: Lists): Pairs {
  const sortedListA = lists.listA.toSorted();
  const sortedListB = lists.listB.toSorted();

  if (sortedListA.length !== sortedListB.length) {
    throw new Error("Got sorted lists of different lengths");
  }

  const pairs: Pairs = [];

  for (let i = 0; i < sortedListA.length; i++) {
    pairs.push([sortedListA[i], sortedListB[i]]);
  }

  return pairs;
}

function calculateDifferences(pairs: Pairs): number[] {
  const differences: number[] = [];
  for (const [a, b] of pairs) {
    differences.push(Math.abs(a - b));
  }

  return differences;
}

function sumList(differences: number[]) {
  return differences.reduce((acc, nextValue) => acc + nextValue, 0);
}

function countOccurances<T>(list: T[]): Map<T, number> {
  const occurances = new Map<T, number>();
  for (const item of list) {
    const currentCount = occurances.get(item) ?? 0;
    occurances.set(item, currentCount + 1);
  }

  return occurances;
}

function calculateSimilarityScore(
  list: number[],
  occurances: Map<number, number>
): number {
  let totalSimilarity = 0;
  for (const item of list) {
    const similarityScore = item * (occurances.get(item) ?? 0);
    totalSimilarity = totalSimilarity + similarityScore;
  }

  return totalSimilarity;
}

function part1() {
  console.log("Part 1");
  const lists = getInput();
  const pairs = convertListsToPairs(lists);
  const differences = calculateDifferences(pairs);
  const totalDistance = sumList(differences);
  console.log(totalDistance);
}

function part2() {
  console.log("Part 2");
  const lists = getInput();
  const occurances = countOccurances(lists.listB);
  const totalSimilarity = calculateSimilarityScore(lists.listA, occurances);
  console.log(totalSimilarity);
}

part1();
part2();
