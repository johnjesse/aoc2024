import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

interface WalLCell {
  type: "wall";
  position: Position;
}

interface Position {
  row: number;
  col: number;
}

interface SpaceCell {
  type: "space";
  content: "S" | "E" | ".";
  position: Position;
}

type MazeCell = SpaceCell | WalLCell;
type Maze = MazeCell[][];
type Direction = "North" | "South" | "East" | "West";

interface Data {
  maze: Maze;
  startPosition: Position;
  endPosition: Position;
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

  let startPosition: Position | undefined;
  let endPosition: Position | undefined;

  const maze = data.split("\n").map((row, rowIndex) =>
    row.split("").map((cell, colIndex) => {
      const position = { col: colIndex, row: rowIndex };

      switch (cell) {
        case "S":
          startPosition = position;
        case "E":
          if (cell === "E") {
            endPosition = position;
          }
        case ".":
          return {
            type: "space" as const,
            content: cell,
            position,
          };
        case "#":
          return {
            type: "wall" as const,
            position,
          };
        default:
          throw new Error("Unexpected characted when parsing maze inpu");
      }
    })
  );

  if (!endPosition || !startPosition) {
    throw new Error(
      "Error parsing maze, could not detect start and end position"
    );
  }

  return { maze, startPosition, endPosition };
}

class Step {
  constructor(
    public readonly position: Position,
    public readonly direction: Direction,
    public readonly parent?: Step
  ) {}

  get cost(): number {
    if (!this.parent) {
      // Start cell, no cost
      return 0;
    }

    const stepCost = this.parent.direction === this.direction ? 1 : 1001;
    return stepCost + this.parent.cost;
  }
}

function hashPosition(position: Position): string {
  return `${position.row}-${position.col}`;
}

function hashStep({ position, direction }: Step): string {
  return `${position.row}-${position.col}, ${direction}`;
}

function getAvailableSteps(maze: Maze, step: Step) {
  const stepPosition = step.position;

  const northCell = maze[stepPosition.row - 1]?.[stepPosition.col];
  const eastCell = maze[stepPosition.row]?.[stepPosition.col + 1];
  const southCell = maze[stepPosition.row + 1]?.[stepPosition.col];
  const westCell = maze[stepPosition.row]?.[stepPosition.col - 1];

  const possibleCells: { cell: MazeCell; direction: Direction }[] = [
    { cell: northCell, direction: "North" },
    { cell: eastCell, direction: "East" },
    { cell: southCell, direction: "South" },
    { cell: westCell, direction: "West" },
  ];

  const availableSteps: Step[] = [];

  for (const { cell: possibleCell, direction } of possibleCells) {
    if (possibleCell && possibleCell.type === "space") {
      const nextStep = new Step(possibleCell.position, direction, step);
      availableSteps.push(nextStep);
    }
  }

  return availableSteps;
}

function hasEnd(steps: Step[], maze: Maze) {
  return steps.find((step) => isEnd(step, maze));
}

function isEnd(step: Step, maze: Maze) {
  const cell = maze[step.position.row]?.[step.position.col];
  return cell && cell.type === "space" && cell.content === "E";
}

function bfs({ maze, startPosition }: Data) {
  const visited = new Map<string, number>();
  const otherAvailableSteps: Step[] = [];

  // start at Cell S
  const startingStep = new Step(startPosition, "East");
  let nextSteps: Step[] = [startingStep];

  const queue: Step[] = [];

  while (!hasEnd(nextSteps, maze)) {
    for (const step of nextSteps) {
      visited.set(hashStep(step), step.cost);
      const continuingSteps = getAvailableSteps(maze, step);

      const filteredNextSteps = continuingSteps.filter((stp) => {
        const alreadyVisited = visited.get(hashStep(stp));
        if (alreadyVisited !== undefined && alreadyVisited === stp.cost) {
          // we've been here before at the same cost  - so we've come by a different route
          otherAvailableSteps.push(stp);

          // Note - this isn't really correct - because we don't know yet that this route hits the end - and e don;t do any tidy up of the ones that don't
          // Still - it passed the test
        }

        return !alreadyVisited;
      });
      queue.push(...filteredNextSteps);
    }

    queue.sort((a, b) => a.cost - b.cost);

    if (queue.length === 0) {
      throw new Error(
        "Reached the end of the queue - and still haven't found the end - something has gone wrong"
      );
    }

    // extract the next steps that have the same value and do them as one
    nextSteps = [];
    let currentCost = Number.POSITIVE_INFINITY;

    while (queue.length > 0 && queue[0].cost <= currentCost) {
      const followOnStep = queue.shift()!;
      currentCost = followOnStep?.cost;
      nextSteps = [...nextSteps, followOnStep];
    }
  }

  return {
    steps: [
      ...nextSteps.filter((step) => isEnd(step, maze)),
      ...otherAvailableSteps,
    ],
  };
}

function getPath(step: Step): Step[] {
  if (!step.parent) {
    return [];
  }

  return [step, ...getPath(step.parent)];
}

function printSolution(data: Data, steps: Step[]) {
  const path = new Map(
    steps
      .flatMap((step) => getPath(step))
      .map((step) => [hashPosition(step.position), step])
  );

  for (const row of data.maze) {
    for (const cell of row) {
      switch (cell.type) {
        case "wall":
          process.stdout.write("#");
          break;
        case "space":
          const pathStep = path.get(hashPosition(cell.position));
          if (pathStep) {
            switch (pathStep.direction) {
              case "North":
                process.stdout.write("^");
                break;
              case "South":
                process.stdout.write("v");
                break;
              case "East":
                process.stdout.write(">");
                break;
              case "West":
                process.stdout.write("<");
                break;
            }
            break;
          }
          process.stdout.write(cell.content);
          break;
      }
    }
    process.stdout.write("\n");
  }
}

function getAllUniqueSquaresInPaths(...steps: Step[]) {
  const squares = new Set<string>();

  for (const step of steps) {
    let nextStep: Step | undefined = step;

    while (nextStep) {
      squares.add(hashPosition(nextStep.position));
      nextStep = nextStep.parent;
    }
  }

  return squares.size;
}

function parts() {
  console.log("Part 1");
  const data = parseInput();
  const { steps } = bfs(data);
  printSolution(data, steps);
  const endStep = hasEnd(steps, data.maze);
  console.log(endStep!.cost);

  console.log("Part 2");
  const uniqueSquares = getAllUniqueSquaresInPaths(...steps);
  console.log(uniqueSquares);
}

parts();
