import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

interface Position {
  row: number;
  col: number;
}

interface CorruptedSpace {
  type: "byte";
  position: Position;
}

interface UncorruptedSpace {
  type: "empty";
  position: Position;
}

type Space = CorruptedSpace | UncorruptedSpace;
type MemorySpace = Space[][];

function parseInput(numCorruptedBytes: number, gridSize: number): MemorySpace {
  const data = readFileSync(join(__dirname, "input")).toString();

  const space: MemorySpace = [];

  const corruptedBytes = new Set(data.split("\n").slice(0, numCorruptedBytes));

  console.log("Number of corrupted bytes", corruptedBytes.size);

  for (let row = 0; row <= gridSize; row++) {
    const memorySpaceRow: Space[] = [];

    for (let col = 0; col <= gridSize; col++) {
      memorySpaceRow.push({
        type: corruptedBytes.has(`${col},${row}`) ? "byte" : "empty",
        position: { col, row },
      });
    }

    space.push(memorySpaceRow);
  }

  return space;
}

class Step {
  constructor(
    public readonly position: Position,
    public readonly parent?: Step
  ) {}

  get cost(): number {
    if (!this.parent) {
      // Starting cell, no cost
      return 0;
    }
    return 1 + this.parent.cost;
  }
}

function hashPosition(position: Position): string {
  return `${position.row}-${position.col}`;
}

function hashStep({ position }: Step): string {
  return `${position.row}-${position.col}`;
}

function getAvailableSteps(maze: MemorySpace, step: Step) {
  const stepPosition = step.position;

  const northCell = maze[stepPosition.row - 1]?.[stepPosition.col];
  const eastCell = maze[stepPosition.row]?.[stepPosition.col + 1];
  const southCell = maze[stepPosition.row + 1]?.[stepPosition.col];
  const westCell = maze[stepPosition.row]?.[stepPosition.col - 1];

  const possibleCells: { space: Space }[] = [
    { space: northCell },
    { space: eastCell },
    { space: southCell },
    { space: westCell },
  ];

  const availableSteps: Step[] = [];

  for (const { space: possibleSpace } of possibleCells) {
    if (possibleSpace && possibleSpace.type === "empty") {
      const nextStep = new Step(possibleSpace.position, step);
      availableSteps.push(nextStep);
    }
  }

  return availableSteps;
}

function hasEnd(steps: Step[], maze: MemorySpace) {
  return steps.find((step) => isEnd(step, maze));
}

function isEnd(step: Step, maze: MemorySpace) {
  const lastRow = maze.length - 1;

  return (
    step.position.row === lastRow &&
    step.position.col === maze[lastRow]!.length - 1
  );
}

function bfs(maze: MemorySpace) {
  const visited = new Map<string, number>();

  // start at Cell S
  const startingStep = new Step({ row: 0, col: 0 });
  let nextStep: Step = startingStep;

  const queue: Step[] = [];

  let iteration = 0;

  while (!isEnd(nextStep, maze)) {
    // console.log("looping", iteration);
    if (!visited.has(hashStep(nextStep))) {
      visited.set(hashStep(nextStep), nextStep.cost);
      const continuingSteps = getAvailableSteps(maze, nextStep);

      const filteredNextSteps = continuingSteps.filter((stp) => {
        const alreadyVisited = visited.get(hashStep(stp));
        return !alreadyVisited;
      });

      queue.push(...filteredNextSteps);

      queue.sort((a, b) => {
        const costDifferentce = a.cost - b.cost;

        if (costDifferentce !== 0) {
          return costDifferentce;
        }

        // They are the same cost - sort by the cartesian distance to the end
        const endRow = maze.length - 1;
        const endCol = maze[endRow].length - 1;

        const aDistance = endRow - a.position.row + endCol - a.position.col;
        const bDistance = endRow - b.position.row + endCol - b.position.col;

        return aDistance - bDistance;
      });
    }

    if (queue.length === 0) {
      throw new Error(
        "Reached the end of the queue - and still haven't found the end - something has gone wrong"
      );
    }

    // extract the next steps that have the same value and do them as one
    nextStep = queue.shift()!;
    let currentCost = Number.POSITIVE_INFINITY;
    iteration++;

    if (iteration % 100 === 0) {
      console.log(nextStep.position, queue.length);
    }
  }

  return {
    endStep: nextStep,
  };
}

function getPath(step: Step): Step[] {
  if (!step.parent) {
    return [];
  }

  return [step, ...getPath(step.parent)];
}

function printSolution(data: MemorySpace, steps: Step[]) {
  const path = new Map(
    steps
      .flatMap((step) => getPath(step))
      .map((step) => [hashPosition(step.position), step])
  );

  for (const row of data) {
    for (const cell of row) {
      switch (cell.type) {
        case "byte":
          process.stdout.write("#");
          break;
        case "empty":
          const pathStep = path.get(hashPosition(cell.position));
          if (pathStep) {
            process.stdout.write("0");
            break;
          }
          process.stdout.write(".");
          break;
      }
    }
    process.stdout.write("\n");
  }
}

function parts() {
  console.log("Part 1");
  const data = parseInput(1024, 70);
  printSolution(data, []);
  const { endStep } = bfs(data);

  if (!endStep) {
    console.log("failed");
    return;
  }

  printSolution(data, [endStep]);
  console.log(endStep!.cost);

  console.log("Part 2");
  // Manual binary search - it runs fast enough :D
  // const data = parseInput(2879, 70);
}

parts();
