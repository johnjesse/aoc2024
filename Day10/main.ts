import { readFileSync } from "fs";
import { join } from "path";

type Grid = number[][];
type Position = readonly [number, number];

interface Data {
  grid: Grid;
  heads: Position[];
  ends: Position[];
}

let memoizedInput: Data | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Data {
  const data = readFileSync(join(__dirname, "input")).toString();

  const heads: Position[] = [];
  const ends: Position[] = [];

  const grid = data.split("\n").map((row, rowIndex) =>
    row.split("").map((val, colIndex) => {
      const value = parseInt(val, 10);
      if (value === 0) {
        heads.push([rowIndex, colIndex]);
      }

      if (value === 9) {
        ends.push([rowIndex, colIndex]);
      }
      return value;
    })
  );

  return { grid, heads, ends };
}

function distanceBetween(pos1: Position, pos2: Position): number {
  return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1]);
}

function isStepPossible(
  head: Position,
  end: Position,
  grid: Grid
): Position | undefined {
  if (distanceBetween(head, end) === 1) {
    const startingValue = grid[head[0]]?.[head[1]];
    const endingValue = grid[end[0]]?.[end[1]];

    if (endingValue - startingValue === 1) {
      return end;
    }
  }
  return;
}

function getPaths(head: Position, grid: Grid): Position[][] {
  let pathLength = 1;
  let currentPossiblePaths: Position[][] = [[head]];
  let nextPossiblePaths: Position[][] = [];

  while (pathLength < 10) {
    for (const currentPossiblePath of currentPossiblePaths) {
      const lastPostion = currentPossiblePath.at(
        currentPossiblePath.length - 1
      )!;

      const northStep = [lastPostion[0] - 1, lastPostion[1]] as const;
      const eastStep = [lastPostion[0], lastPostion[1] + 1] as const;
      const southStep = [lastPostion[0] + 1, lastPostion[1]] as const;
      const westStep = [lastPostion[0], lastPostion[1] - 1] as const;

      if (isStepPossible(lastPostion, northStep, grid)) {
        nextPossiblePaths.push([...currentPossiblePath, northStep]);
      }

      if (isStepPossible(lastPostion, eastStep, grid)) {
        nextPossiblePaths.push([...currentPossiblePath, eastStep]);
      }

      if (isStepPossible(lastPostion, westStep, grid)) {
        nextPossiblePaths.push([...currentPossiblePath, westStep]);
      }

      if (isStepPossible(lastPostion, southStep, grid)) {
        nextPossiblePaths.push([...currentPossiblePath, southStep]);
      }
    }

    currentPossiblePaths = nextPossiblePaths;
    nextPossiblePaths = [];
    pathLength++;
  }
  return currentPossiblePaths;
}

function trailKey(head: Position, end: Position): string {
  return `${head[0]},${head[1]} -> ${end[0]}, ${end[1]}`;
}

function computeTrails(data: Data) {
  const trailMaps: Map<string, Position[][]>[] = [];

  for (const head of data.heads) {
    // get all paths for that head
    const possiblePaths = getPaths(head, data.grid);

    const pathMap = new Map<string, Position[][]>();

    for (const path of possiblePaths) {
      const key = trailKey(head, path[path.length - 1]);
      const storedPaths = pathMap.get(key);

      pathMap.set(key, storedPaths ? [...storedPaths, path] : [path]);
    }

    trailMaps.push(pathMap);
  }

  return trailMaps;
}

function computeSimplePathScore(pathMap: Map<string, Position[][]>) {
  return pathMap.size;
}

function getTotalScore(
  trailMaps: Map<string, Position[][]>[],
  scorePath: (athMap: Map<string, Position[][]>) => number
) {
  return trailMaps.reduce((acc, next) => acc + scorePath(next), 0);
}

function part1() {
  console.log("Part 1");
  const data = getInput();
  const trailMaps = computeTrails(data);
  const totalScore = getTotalScore(trailMaps, (pathMap) => pathMap.size);
  console.log(totalScore);
}

function part2() {
  console.log("Part 2");
  const data = getInput();
  const trailMaps = computeTrails(data);
  const totalScore = getTotalScore(trailMaps, (pathMap) =>
    Array.from(pathMap.entries()).reduce(
      (acc, [key, paths]) => acc + paths.length,
      0
    )
  );
  console.log(totalScore);
}

part1();
part2();
