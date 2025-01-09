import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

interface Key {
  type: "key";
  heights: [number, number, number, number, number];
}

interface Lock {
  type: "lock";
  heights: [number, number, number, number, number];
}

interface Data {
  keys: Key[];
  locks: Lock[];
}

function parseInput(): Data {
  const inputsRaw = readFileSync(join(__dirname, "input")).toString();

  const keys: Key[] = [];
  const locks: Lock[] = [];

  const keysAndLocks = inputsRaw.split("\n\n");

  for (const keyOrLock of keysAndLocks) {
    const grid = keyOrLock.split("\n").map((row) => row.split(""));

    const firstRow = grid[0];

    const isLock = firstRow.every((cell) => cell === "#");

    if (isLock) {
      // LOCK
      const heights: number[] = [];

      for (let i = 0; i < firstRow.length; i++) {
        // find the last # in each column;
        let height: number | undefined = undefined;
        let rowIndex = grid.length - 1;

        while (height === undefined && rowIndex >= 0) {
          // Search the column from the bottom
          if (grid[rowIndex][i] === "#") {
            height = rowIndex;
          }
          rowIndex--;
        }

        if (height === undefined) {
          throw new Error(`Could not find height of lock, ${rowIndex}, ${i}`);
        }

        heights.push(height);
      }

      locks.push({ type: "lock", heights: heights as any });
    } else {
      // KEY
      const heights: number[] = [];

      for (let i = 0; i < firstRow.length; i++) {
        // find the last # in each column;
        let height: number | undefined = undefined;
        let rowIndex = 0;

        while (height === undefined && rowIndex < grid.length) {
          // Search the column from the bottom
          if (grid[rowIndex][i] === "#") {
            height = grid.length - rowIndex - 1;
          }
          rowIndex++;
        }

        if (height === undefined) {
          throw new Error("Could not find height of key");
        }

        heights.push(height);
      }

      keys.push({ type: "key", heights: heights as any });
    }
  }

  return { locks, keys };
}

function doesKeyFitInLock(key: Key, lock: Lock) {
  return key.heights.every(
    (height, index) => height + lock.heights[index] <= 5
  );
}

function getPossibleLocksForKey(key: Key, locks: Lock[]) {
  return locks.filter((lock) => doesKeyFitInLock(key, lock));
}

function countPossibleLockKeyCombos(keys: Key[], locks: Lock[]) {
  return keys.reduce(
    (acc, nextKey) => acc + getPossibleLocksForKey(nextKey, locks).length,
    0
  );
}

function part1() {
  console.log("Part 1");
  const { keys, locks } = parseInput();
  const possibleCombinations = countPossibleLockKeyCombos(keys, locks);
  console.log(possibleCombinations);
}

function part2() {
  console.log("Part 2");
}

part1();
// part2();
