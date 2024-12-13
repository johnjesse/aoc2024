import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

let memoizedInput: Machine[] | undefined = undefined;

interface Machine {
  a: { x: number; y: number };
  b: { x: number; y: number };
  prize: { x: number; y: number };
}

function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Machine[] {
  const data = readFileSync(join(__dirname, "input")).toString();
  const regExp =
    /Button A: X\+(\d+), Y\+(\d+)\s+Button B: X\+(\d+), Y\+(\d+)\s+Prize: X=(\d+), Y=(\d+)/g;

  const matches = data.matchAll(regExp);

  const machines: Machine[] = [];

  for (const match of matches) {
    const [, ax, ay, bx, by, px, py] = match;
    machines.push({
      a: {
        x: parseInt(ax, 10),
        y: parseInt(ay, 10),
      },
      b: {
        x: parseInt(bx, 10),
        y: parseInt(by, 10),
      },
      prize: {
        x: parseInt(px, 10),
        y: parseInt(py, 10),
      },
    });
  }

  return machines;
}

interface WalkThrough {
  aPresses: number;
  bPresses: number;
}

function getClawPosition(aPresses: number, bPresses: number, machine: Machine) {
  const xPos = machine.a.x * aPresses + machine.b.x * bPresses;
  const yPos = machine.a.y * aPresses + machine.b.y * bPresses;
  return {
    x: xPos,
    y: yPos,
  };
}

function canStillReachPrize(
  aPresses: number,
  bPresses: number,
  machine: Machine
) {
  const { x, y } = getClawPosition(aPresses, bPresses, machine);
  return x <= machine.prize.x || y <= machine.prize.y;
}

function isOnPrize(aPresses: number, bPresses: number, machine: Machine) {
  const { x, y } = getClawPosition(aPresses, bPresses, machine);

  return x === machine.prize.x && y === machine.prize.y;
}

interface MaxPresses {
  a: number;
  b: number;
}

const DefaultMaxPresses: MaxPresses = {
  a: 100,
  b: 100,
};

function solveSimulataneousEquation({
  a,
  b,
  prize,
}: Machine): WalkThrough | undefined {
  if (a.y * b.x - a.x * b.y === 0) {
    // infinite solutions to the simulataneous equation
    // so if there is a solution you should only need b
    const bXPresses = prize.x / b.x;
    const bYPresses = prize.y / b.y;

    if (bXPresses === bYPresses) {
      return {
        aPresses: 0,
        bPresses: bXPresses,
      };
    }

    return undefined;
  }

  // Single solution to the simultaneous equation
  const bPresses = (a.y * prize.x - a.x * prize.y) / (a.y * b.x - a.x * b.y);

  const aPresses = (prize.x - bPresses * b.x) / a.x;

  if (aPresses === Math.floor(aPresses) && bPresses === Math.floor(bPresses)) {
    return { aPresses, bPresses };
  }

  return undefined;
}

function calculateWaysToWinPrize(machine: Machine): WalkThrough | undefined {
  return solveSimulataneousEquation(machine);
}

function isWalkThrough(
  solution: WalkThrough | undefined
): solution is WalkThrough {
  return solution !== undefined;
}

interface Costs {
  a: number;
  b: number;
}

function getCost(solution: WalkThrough, costs: Costs) {
  return solution.aPresses * costs.a + solution.bPresses * costs.b;
}

function part1() {
  console.log("Part 1");
  const machines = parseInput();
  const solutionsPreMachine = machines
    .map((m) => calculateWaysToWinPrize(m))
    .filter(isWalkThrough);
  const cheapestSolutions = solutionsPreMachine.map((solution) =>
    getCost(solution, { a: 3, b: 1 })
  );

  const total = cheapestSolutions.reduce(
    (acc, next) => (acc ?? 0) + (next ?? 0),
    0
  );
  console.log(total);
}

function correctPrizeCoordintates(machines: Machine[]): Machine[] {
  const correction = 10000000000000;
  return machines.map((m) => ({
    ...m,
    prize: { x: correction + m.prize.x, y: correction + m.prize.y },
  }));
}

function part2() {
  console.log("Part 1");
  const machines = correctPrizeCoordintates(parseInput());
  const solutionsPreMachine = machines
    .map((m) => calculateWaysToWinPrize(m))
    .filter(isWalkThrough);
  const cheapestSolutions = solutionsPreMachine.map((solution) =>
    getCost(solution, { a: 3, b: 1 })
  );

  const total = cheapestSolutions.reduce(
    (acc, next) => (acc ?? 0) + (next ?? 0),
    0
  );
  console.log(total);
}

part1();
part2();
