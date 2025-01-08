import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

type Move = ">" | "<" | "^" | "v";

type NumberInput =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "a";

function parseInput(): string[] {
  // replace A with a so that we can distinguish numeric keys from direction keys
  const input = readFileSync(join(__dirname, "input"))
    .toString()
    .replaceAll("A", "a");

  const codes = input.split("\n");

  return codes;
}

//
// NUMERIC KEYPAD
//
// |---|---|---|
// | 7 | 8 | 9 |
// |---|---|---|
// | 4 | 5 | 6 |
// |---|---|---|
// | 1 | 2 | 3 |
// |---|---|---|
//     | 0 | a |
//     |---|---|
//
function getPossibleMovesOnNumericKeypad(input: NumberInput): Move[] {
  switch (input) {
    case "a":
      return ["^", "<"];
    case "0":
      return ["^", ">"];
    case "1":
      return ["^", ">"];
    case "2":
      return ["^", "v", "<", ">"];
    case "3":
      return ["^", "v", "<"];
    case "4":
      return ["^", "v", ">"];
    case "5":
      return ["^", "v", "<", ">"];
    case "6":
      return ["^", "v", "<"];
    case "7":
      return ["v", ">"];
    case "8":
      return ["v", "<", ">"];
    case "9":
      return ["v", "<"];
  }
}

function moveOnNumericKeypad(start: NumberInput, move: Move): NumberInput {
  let newPosition: NumberInput | undefined = undefined;

  switch (start) {
    case "a":
      switch (move) {
        case "^":
          newPosition = "3";
          break;
        case "<":
          newPosition = "0";
          break;
      }
      break;
    case "0":
      switch (move) {
        case "^":
          newPosition = "2";
          break;
        case ">":
          newPosition = "a";
          break;
      }
      break;
    case "1":
      switch (move) {
        case "^":
          newPosition = "4";
          break;
        case ">":
          newPosition = "2";
          break;
      }
      break;
    case "2":
      switch (move) {
        case "^":
          newPosition = "5";
          break;
        case "v":
          newPosition = "0";
          break;
        case "<":
          newPosition = "1";
          break;
        case ">":
          newPosition = "3";
          break;
      }
      break;
    case "3":
      switch (move) {
        case "^":
          newPosition = "6";
          break;
        case "v":
          newPosition = "a";
          break;
        case "<":
          newPosition = "2";
          break;
      }
      break;
    case "4":
      switch (move) {
        case "^":
          newPosition = "7";
          break;
        case "v":
          newPosition = "1";
          break;
        case ">":
          newPosition = "5";
          break;
      }
      break;
    case "5":
      switch (move) {
        case "^":
          newPosition = "8";
          break;
        case "v":
          newPosition = "2";
          break;
        case "<":
          newPosition = "4";
          break;
        case ">":
          newPosition = "6";
          break;
      }
      break;
    case "6":
      switch (move) {
        case "^":
          newPosition = "9";
          break;
        case "v":
          newPosition = "3";
          break;
        case "<":
          newPosition = "5";
          break;
      }
      break;
    case "7":
      switch (move) {
        case "v":
          newPosition = "4";
          break;
        case ">":
          newPosition = "8";
          break;
      }
      break;
    case "8":
      switch (move) {
        case "v":
          newPosition = "5";
          break;
        case "<":
          newPosition = "7";
          break;
        case ">":
          newPosition = "9";
          break;
      }
      break;
    case "9":
      switch (move) {
        case "v":
          newPosition = "6";
          break;
        case "<":
          newPosition = "8";
          break;
      }
      break;
  }

  if (!newPosition) {
    throw new Error(`Move  ${move} was invalid for position ${start}`);
  }

  return newPosition;
}

type DirectionInput = Move | "A";

//
// DIRECTIONAL KEYPAD
//
//     |---|---|
//     | ^ | A |
// |---|---|---|
// | < | v | > |
// |---|---|---|
//
function getPossibleMovesOnDirectionalKeypad(input: DirectionInput): Move[] {
  switch (input) {
    case "A":
      return ["v", "<"];
    case "^":
      return ["v", ">"];
    case ">":
      return ["^", "<"];
    case "v":
      return ["^", "<", ">"];
    case "<":
      return [">"];
  }
}

function moveOnDirectionalKeypad(
  start: DirectionInput,
  move: Move
): DirectionInput {
  let newPosition: DirectionInput | undefined = undefined;

  switch (start) {
    case "A":
      switch (move) {
        case "v":
          newPosition = ">";
          break;
        case "<":
          newPosition = "^";
          break;
      }
      break;
    case "^":
      switch (move) {
        case "v":
          newPosition = "v";
          break;
        case ">":
          newPosition = "A";
          break;
      }
      break;
    case ">":
      switch (move) {
        case "^":
          newPosition = "A";
          break;
        case "<":
          newPosition = "v";
          break;
      }
      break;
    case "v":
      switch (move) {
        case "^":
          newPosition = "^";
          break;
        case "<":
          newPosition = "<";
          break;
        case ">":
          newPosition = ">";
          break;
      }
      break;
    case "<":
      switch (move) {
        case ">":
          newPosition = "v";
          break;
      }
      break;
  }

  if (!newPosition) {
    throw new Error(`Move  ${move} was invalid for position ${start}`);
  }

  return newPosition;
}

function isDirectionalInput(
  input: NumberInput | DirectionInput
): input is DirectionInput {
  return (
    input === "A" ||
    input === "<" ||
    input === ">" ||
    input === "^" ||
    input === "v"
  );
}

function getPossibleMoves(input: NumberInput | DirectionInput): Move[] {
  if (isDirectionalInput(input)) {
    return getPossibleMovesOnDirectionalKeypad(input);
  } else {
    return getPossibleMovesOnNumericKeypad(input);
  }
}

const shortestPossiblePathsCache = new Map<string, DirectionInput[][]>();

function getShortestPossiblePaths(
  from: NumberInput,
  to: NumberInput
): DirectionInput[][];
function getShortestPossiblePaths(
  from: DirectionInput,
  to: DirectionInput
): DirectionInput[][];
function getShortestPossiblePaths(
  from: NumberInput | DirectionInput,
  to: NumberInput | DirectionInput
): DirectionInput[][] {
  const paths = buildPaths(from as any, to as any);

  const key = `${from}->${to}`;
  const calculatedPaths = shortestPossiblePathsCache.get(key);

  if (calculatedPaths) {
    calculatedPaths;
  }

  // filter and keep only the shortest paths;
  let shortestLength: number | undefined = undefined;

  paths.forEach((path) => {
    if (shortestLength === undefined || path.length < shortestLength) {
      shortestLength = path.length;
    }
  });

  const shortestPaths = paths
    .filter((path) => path.length === shortestLength)
    .map((path) => path.concat("A"));

  shortestPossiblePathsCache.set(key, shortestPaths);
  return shortestPaths;
}

function buildPaths(
  startPosition: NumberInput,
  endPosition: NumberInput,
  previousPositions?: NumberInput[]
): DirectionInput[][];
function buildPaths(
  startPosition: DirectionInput,
  endPosition: DirectionInput,
  previousPositions?: DirectionInput[]
): DirectionInput[][];
function buildPaths(
  startPosition: DirectionInput | NumberInput,
  endPosition: DirectionInput | NumberInput,
  previousPositions: (DirectionInput | NumberInput)[] = []
): DirectionInput[][] {
  if (startPosition === endPosition) {
    // we've arrived
    return [[]];
  }

  const paths: DirectionInput[][] = [];
  const possibleMoves = getPossibleMoves(startPosition);

  for (const move of possibleMoves) {
    const nextPosition = isDirectionalInput(startPosition)
      ? moveOnDirectionalKeypad(startPosition, move)
      : moveOnNumericKeypad(startPosition, move);

    if (previousPositions.includes(nextPosition)) {
      // We've laready been here - looping position so drop this path
      continue;
    }
    const nextPaths: DirectionInput[][] = buildPaths(
      nextPosition as any,
      endPosition as any,
      previousPositions.concat([nextPosition]) as any
    ).map((nextPath) => [move as DirectionInput].concat(nextPath));

    paths.push(...nextPaths);
  }

  return paths;
}

function getSmallest(arr: number[]): number {
  let shortest: number | undefined = undefined;

  for (const item of arr) {
    if (shortest === undefined || item < shortest) {
      shortest = item;
    }
  }

  if (shortest === undefined) {
    throw new Error("Could not find shortest in empty array");
  }
  return shortest;
}

function getShortestPathWithXKeypads(
  from: NumberInput,
  to: NumberInput,
  nDirectionalKeypads: number
) {
  const numericPaths = getShortestPossiblePaths(from, to);

  const shortestPath = getSmallest(
    numericPaths.map((path) =>
      getShortestPathLengthWithXDirectionalKeypads(path, nDirectionalKeypads)
    )
  );

  return shortestPath;
}

const shortestPathLengthCache = new Map<string, number>();

function getShortestPathLengthWithXDirectionalKeypads(
  moves: DirectionInput[],
  nDirectionalKeypads: number
): number {
  const key = `${moves.join("")}-${nDirectionalKeypads}`;
  const cachedValue = shortestPathLengthCache.get(key);

  if (cachedValue) {
    return cachedValue;
  }

  let positions = [...moves];
  let firstPosition = "A" as DirectionInput;

  if (nDirectionalKeypads === 0) {
    const path: DirectionInput[] = [];

    for (const nextPosition of positions) {
      const paths = getShortestPossiblePaths(firstPosition, nextPosition);
      // these are all as short as each other - so take the first one
      path.push(...paths[0]);
      firstPosition = nextPosition;
    }

    shortestPathLengthCache.set(key, path.length);

    return path.length;
  }

  let shortestPathLength = 0;

  for (const nextPosition of positions) {
    const paths = getShortestPossiblePaths(firstPosition, nextPosition);

    const shortestPathSectionLengths = paths.map((nextMoves) =>
      getShortestPathLengthWithXDirectionalKeypads(
        nextMoves,
        nDirectionalKeypads - 1
      )
    );

    const shortestSection = getSmallest(shortestPathSectionLengths);

    shortestPathLength = shortestPathLength + shortestSection!;
    firstPosition = nextPosition;
  }

  shortestPathLengthCache.set(key, shortestPathLength);
  return shortestPathLength;
}

/**
 *
 * The minimum is 1
 */
function expandCode(numericCode: string, nKeypads: number) {
  const cells: NumberInput[] = numericCode.split("") as NumberInput[];

  let start: NumberInput = "a";

  let pathLength: number = 0;

  for (const cell of cells) {
    pathLength =
      pathLength + getShortestPathWithXKeypads(start, cell, nKeypads - 1);
    start = cell;
  }

  return pathLength;
}

function part1() {
  console.log("Part 1");
  const codes = parseInput();
  const sum = codes
    .map((code) => {
      const expanded = expandCode(code, 2);
      const codeAsNum = parseInt(code.substring(0, code.length - 1), 10);
      console.log(code, codeAsNum, expanded);
      return codeAsNum * expanded;
    })
    .reduce((acc, next) => acc + next, 0);
  console.log(sum);
}

function part2() {
  console.log("Part 2");
  const codes = parseInput();
  const sum = codes
    .map((code) => {
      const expanded = expandCode(code, 25);
      const codeAsNum = parseInt(code.substring(0, code.length - 1), 10);
      console.log(code, codeAsNum, expanded);
      return codeAsNum * expanded;
    })
    .reduce((acc, next) => acc + next, 0);
  console.log(sum);
}

part1();
part2();
