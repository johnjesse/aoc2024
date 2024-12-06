import { readFileSync } from "fs";
import { join, parse } from "path";

let memoizedInput: Grid | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

type Grid = string[][];
type Position = [number, number];
type Orientation = "v" | "^" | ">" | "<";

function parseInput(): Grid {
  const rulesData = readFileSync(join(__dirname, "input")).toString();
  const rawRows = rulesData.split("\n");
  const rows = rawRows.map((r) => r.split(""));

  return rows;
}

function assertOrientation(value: string): asserts value is Orientation {
  if (isOrientation(value)) {
    return;
  }

  throw new Error("Unknown orientation");
}

function isOrientation(value: string): value is Orientation {
  return value === "v" || value === "<" || value === "^" || value === ">";
}

function getStartingPosition(grid: Grid): Position {
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];

      if (isOrientation(cell)) {
        return [rowIndex, colIndex];
      }
    }
  }

  throw new Error("Unable to find starting position");
}

function getNextCellPosition(
  currentCellPosition: Position,
  currentOrientation: Orientation
): Position {
  switch (currentOrientation) {
    case "<":
      return [currentCellPosition[0], currentCellPosition[1] - 1];
    case ">":
      return [currentCellPosition[0], currentCellPosition[1] + 1];
    case "^":
      return [currentCellPosition[0] - 1, currentCellPosition[1]];
    case "v":
      return [currentCellPosition[0] + 1, currentCellPosition[1]];
  }
}

function canMoveToNextCell(nextCellPosition: Position, grid: Grid): boolean {
  const nextCell = grid[nextCellPosition[0]]?.[nextCellPosition[1]];
  return nextCell !== "#";
}

function rotate(currentOrientation: Orientation): Orientation {
  switch (currentOrientation) {
    case "<":
      return "^";
    case "^":
      return ">";
    case ">":
      return "v";
    case "v":
      return "<";
  }
}

function walkGrid(
  grid: Grid,
  startingPoint: Position,
  positionCallback: (pos: Position, orientation: Orientation) => void,
  continueWalking: (
    currentPosition: Position,
    currentOrientation: Orientation
  ) => boolean
) {
  let currentPosition = startingPoint;

  const initialOrientation = grid[startingPoint[0]][startingPoint[1]];
  assertOrientation(initialOrientation);
  let currentOrientation = initialOrientation;

  while (
    grid[currentPosition[0]]?.[currentPosition[1]] !== undefined &&
    continueWalking(currentPosition, currentOrientation)
  ) {
    positionCallback(currentPosition, currentOrientation);

    const potentialNextCell = getNextCellPosition(
      currentPosition,
      currentOrientation
    );

    if (canMoveToNextCell(potentialNextCell, grid)) {
      currentPosition = potentialNextCell;
    } else {
      currentOrientation = rotate(currentOrientation);
    }
  }

  return;
}

function walkAndTrackPositions(grid: Grid, startingPoint: Position) {
  const visited = new Set<string>();

  walkGrid(
    grid,
    startingPoint,
    (position) => {
      visited.add(`${position[0]}-${position[1]}`);
    },
    () => true
  );

  return visited;
}

function doesGuardWalkInALoop(grid: Grid, startingPoint: Position): boolean {
  const visited = new Set<string>();

  let hasLooped = false;

  walkGrid(
    grid,
    startingPoint,
    (position, orientation) => {
      const hash = `${position[0]}-${position[1]}-${orientation}`;

      if (visited.has(hash)) {
        hasLooped = true;
      } else {
        visited.add(`${position[0]}-${position[1]}-${orientation}`);
      }
    },
    () => !hasLooped
  );

  return hasLooped;
}

function findLoops(grid: Grid, startingPoint: Position) {
  let loopCount = 0;

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];

      if (!isOrientation(cell) && cell !== "#") {
        const newGrid = grid.with(rowIndex, row.with(colIndex, "#"));

        if (doesGuardWalkInALoop(newGrid, startingPoint)) {
          loopCount++;
        }
      }
    }
  }

  return loopCount;
}

function part1() {
  console.log("Part 1");
  const grid = parseInput();
  const startingPoint = getStartingPosition(grid);
  const visitedPositions = walkAndTrackPositions(grid, startingPoint);
  console.log(visitedPositions.size);
}

function part2() {
  console.log("Part 2");
  const grid = parseInput();
  const startingPoint = getStartingPosition(grid);
  const loops = findLoops(grid, startingPoint);
  console.log(loops);
}

part1();
part2();
