import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

type RaceArena = Cell[][];

interface Wall {
  position: Position;
  type: "wall";
}

interface Track {
  position: Position;
  type: "track";
  content: "." | "S" | "E";
}

interface Position {
  col: number;
  row: number;
}

type Cell = Track | Wall;

interface Data {
  start: Position;
  end: Position;
  arena: RaceArena;
}

function parseInput(): Data {
  const input = readFileSync(join(__dirname, "input")).toString();

  let startPosition: Position | undefined = undefined;
  let endPosition: Position | undefined = undefined;

  const arena = input.split("\n").map((row, rowIndex) =>
    row.split("").map((cell, colIndex) => {
      const position: Position = {
        row: rowIndex,
        col: colIndex,
      };
      switch (cell) {
        case "#":
          return {
            position,
            type: "wall" as const,
          };
        case "E":
          endPosition = position;
        case "S":
          if (cell === "S") {
            startPosition = position;
          }
        case ".":
          return {
            position,
            type: "track" as const,
            content: cell,
          };
        default:
          throw new Error("Unrecognised input");
      }
    })
  );

  if (!startPosition || !endPosition) {
    throw new Error("No start or End");
  }

  return { arena, start: startPosition, end: endPosition };
}

class Step {
  constructor(
    public readonly position: Position,
    public readonly parent?: Step
  ) {}

  private get travelTime(): number {
    if (!this.parent) {
      // Finish cell, no travelling
      return 0;
    }
    return 1;
  }

  get timeFromFinish(): number {
    if (!this.parent) {
      // Finish cell, already at finish
      return 0;
    }

    return this.travelTime + this.parent.timeFromFinish;
  }
}

function arePositionsDifferent(position1?: Position, position2?: Position) {
  if (!position1 || !position2) {
    return true;
  }

  return position1.row !== position2.row || position1.col !== position2.col;
}

function getPreviousPosition(step: Step, arena: RaceArena): Step {
  const position = step.position;
  const parentPosition = step.parent?.position;
  const northCell = arena[position.row - 1]?.[position.col];

  if (
    northCell &&
    northCell.type === "track" &&
    arePositionsDifferent(northCell.position, parentPosition)
  ) {
    return new Step(northCell.position, step);
  }

  const southCell = arena[position.row + 1]?.[position.col];

  if (
    southCell &&
    southCell.type === "track" &&
    arePositionsDifferent(southCell.position, parentPosition)
  ) {
    return new Step(southCell.position, step);
  }

  const eastCell = arena[position.row]?.[position.col + 1];

  if (
    eastCell &&
    eastCell.type === "track" &&
    arePositionsDifferent(eastCell.position, parentPosition)
  ) {
    return new Step(eastCell.position, step);
  }

  const westCell = arena[position.row]?.[position.col - 1];

  if (
    westCell &&
    westCell.type === "track" &&
    arePositionsDifferent(westCell.position, parentPosition)
  ) {
    return new Step(westCell.position, step);
  }

  throw new Error("No previous position");
}

function getRaceTrack(
  finishPosition: Position,
  startPosition: Position,
  arena: RaceArena
): Step[] {
  const finishStep = new Step(finishPosition);

  function isStartPosition(step: Step) {
    return (
      step.position.row === startPosition.row &&
      step.position.col === startPosition.col
    );
  }

  let nextStep = finishStep;
  const path = [finishStep];

  while (!isStartPosition(nextStep)) {
    const nextPartOfRaceTrack = getPreviousPosition(nextStep, arena);
    path.push(nextPartOfRaceTrack);
    nextStep = nextPartOfRaceTrack;
  }

  return path;
}

class TimeFromFinishMap {
  private readonly map = new Map<string, number>();

  constructor(track: Step[]) {
    for (const section of track) {
      this.set(section.position, section.timeFromFinish);
    }
  }

  private hashPosition(position: Position) {
    return `${position.row}-${position.col}`;
  }

  public has(position: Position) {
    return this.map.has(this.hashPosition(position));
  }

  public get(position: Position) {
    return this.map.get(this.hashPosition(position));
  }

  public set(position: Position, timeFromFinish: number) {
    return this.map.set(this.hashPosition(position), timeFromFinish);
  }
}

function getPotentialShortcuts(
  position: Position,
  arena: RaceArena,
  distance: number
): [Position, number][] {
  const potentialShortcuts: [Position, number][] = [];

  for (let i = -distance; i <= distance; i++) {
    for (let j = -distance; j <= distance; j++) {
      const totalDistance = Math.abs(i) + Math.abs(j);
      if (totalDistance > distance || totalDistance === 0) {
        continue;
      }

      const cell = arena[position.row + i]?.[position.col + j];

      if (cell?.type === "track") {
        // console.log("track at", cell.position, i, j);
        potentialShortcuts.push([cell.position, totalDistance]);
      }
    }
  }

  return potentialShortcuts;
}

function calculatePossibleShortCuts(
  minSaving: number,
  raceTrack: Step[],
  arena: RaceArena,
  maxDistance: number
): [Position, number][] {
  const validShortcuts: [Position, number][] = [];

  const timeFromFinish = new TimeFromFinishMap(raceTrack);

  for (const section of raceTrack) {
    const potentialShortCuts = getPotentialShortcuts(
      section.position,
      arena,
      maxDistance
    );
    // console.log(potentialShortCuts.length);

    for (const [position, distance] of potentialShortCuts) {
      const timeSaving =
        timeFromFinish.get(position)! - section.timeFromFinish - distance / 1;
      if (timeSaving >= minSaving) {
        validShortcuts.push([position, timeSaving]);
      }
    }
  }

  return validShortcuts;
}

function part1() {
  console.log("Part 1");
  const { start, end, arena } = parseInput();
  console.log(start, end);

  const raceTrack = getRaceTrack(end, start, arena);
  const possibleShortCuts = calculatePossibleShortCuts(
    100,
    raceTrack,
    arena,
    2
  );

  console.log(possibleShortCuts.length);
}

function part2() {
  console.log("Part 2");
  const { start, end, arena } = parseInput();
  console.log(start, end);

  const raceTrack = getRaceTrack(end, start, arena);
  const possibleShortCuts = calculatePossibleShortCuts(
    100,
    raceTrack,
    arena,
    20
  );

  console.log(possibleShortCuts.length);
}

part1();
part2();
