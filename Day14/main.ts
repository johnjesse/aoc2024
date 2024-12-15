import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

let memoizedInput: Robot[] | undefined = undefined;

interface Robot {
  position: Position;
  velocity: Velocity;
}

interface Position {
  x: number;
  y: number;
}

interface Velocity extends Position {}

function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Robot[] {
  const data = readFileSync(join(__dirname, "input")).toString();
  const regExp = /p=(\d+),(\d+) v=(-?\d+),(-?\d+)/;

  const robots = data.split("\n").map((row) => {
    const [, px, py, vx, vy] = row.match(regExp)!;

    return {
      position: { x: parseInt(px, 10), y: parseInt(py, 10) },
      velocity: { x: parseInt(vx, 10), y: parseInt(vy, 10) },
    };
  });

  return robots;
}

interface GridSizes {
  x: number;
  y: number;
}

function loopPositionBackToGrid(
  position: Position,
  gridSizes: GridSizes
): Position {
  let { x, y } = position;

  x = x % gridSizes.x < 0 ? gridSizes.x + (x % gridSizes.x) : x % gridSizes.x;
  y = y % gridSizes.y < 0 ? gridSizes.y + (y % gridSizes.y) : y % gridSizes.y;

  return { x, y };
}

function getPositionAfter(
  robot: Robot,
  nSeconds: number,
  gridSizes: GridSizes
): Position {
  return loopPositionBackToGrid(
    {
      x: robot.position.x + nSeconds * robot.velocity.x,
      y: robot.position.y + nSeconds * robot.velocity.y,
    },
    gridSizes
  );
}

function getRobotsInEachQuadrant(
  robots: Robot[],
  gridSizes: GridSizes
): number[] {
  const middleRow = Math.floor(gridSizes.y / 2);
  const middleCol = Math.floor(gridSizes.x / 2);

  let topLeft = 0;
  let topRight = 0;
  let bottomLeft = 0;
  let bottomRight = 0;

  function isRobotLeftOrRight(robot: Robot): "left" | "right" | undefined {
    if (robot.position.x === middleCol) {
      return undefined;
    }

    if (robot.position.x < middleCol) {
      return "left";
    }

    return "right";
  }

  function isRobotTopOrBottom(robot: Robot): "top" | "bottom" | undefined {
    if (robot.position.y === middleRow) {
      return undefined;
    }

    if (robot.position.y < middleRow) {
      return "top";
    }

    return "bottom";
  }

  for (const robot of robots) {
    const vertical = isRobotTopOrBottom(robot);
    const horizontal = isRobotLeftOrRight(robot);

    if (!vertical || !horizontal) {
      continue;
    }

    switch (vertical) {
      case "bottom":
        if (horizontal === "left") {
          bottomLeft++;
        } else {
          bottomRight++;
        }
        break;
      case "top":
        if (horizontal === "left") {
          topLeft++;
        } else {
          topRight++;
        }
        break;
    }
  }
  return [topLeft, topRight, bottomLeft, bottomRight];
}

function hashPosition({ x, y }: Position) {
  return `${x},${y}`;
}

function printRobots(gridSizes: GridSizes, robots: Robot[]) {
  const robotPositions = new Map<string, number>();

  console.log("----------------");

  for (const robot of robots) {
    robotPositions.set(
      hashPosition(robot.position),
      (robotPositions.get(hashPosition(robot.position)) ?? 0) + 1
    );
  }

  for (let row = 0; row < gridSizes.y; row++) {
    for (let col = 0; col < gridSizes.x; col++) {
      process.stdout.write(
        robotPositions.get(hashPosition({ x: col, y: row }))?.toString() ?? "."
      );
    }
    process.stdout.write("\n");
  }

  console.log("----------------");
}

function part1() {
  console.log("Part 1");
  const robots = getInput();
  const gridSizes = { x: 101, y: 103 };
  const finalRobots = robots.map((robot) => ({
    ...robot,
    position: getPositionAfter(robot, 100, gridSizes),
  }));

  const quadrants = getRobotsInEachQuadrant(finalRobots, gridSizes);
  console.log(quadrants.reduce((acc, next) => acc * next, 1));
}

async function part2() {
  console.log("Part 2");
  const robots = getInput();
  const gridSizes = { x: 101, y: 103 };

  function printFor(seconds: number) {
    const finalRobots = robots.map((robot) => ({
      ...robot,
      position: getPositionAfter(robot, seconds, gridSizes),
    }));

    printRobots(gridSizes, finalRobots);
  }

  for (let i = 48; i <= 17000; i = i + 101) {
    console.log("Count is ", i);
    printFor(i);
    await new Promise((res) => setTimeout(res, 200));
  }
}

// part1();
part2();
// Note answer came at 6512
