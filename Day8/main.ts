import { readFileSync } from "fs";
import { join } from "path";

type Position = [number, number];

type Grid = string[][];
type AntennaId = string;

let memoizedInput: Grid | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Grid {
  const data = readFileSync(join(__dirname, "input")).toString();
  const grid = data.split("\n").map((row) => row.split(""));
  return grid;
}

const EmptySpaceSymbol = ".";

function getAntennas(grid: Grid) {
  const antennaMap = new Map<AntennaId, Position[]>();

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];

    for (let j = 0; j < row.length; j++) {
      const position: Position = [i, j];
      const potentialAntennaId = row[j];

      if (potentialAntennaId !== EmptySpaceSymbol) {
        const existingAntennas = antennaMap.get(potentialAntennaId);

        antennaMap.set(
          potentialAntennaId,
          existingAntennas ? existingAntennas.concat([position]) : [position]
        );
      }
    }
  }

  return antennaMap;
}

function hashPosition(position: Position) {
  return `${position[0]}-${position[1]}`;
}

function unHashPosition(positionHash: string): Position {
  return positionHash.split("-").map((val) => parseInt(val, 10)) as Position;
}

function getUniqueAntennaAntinodePositionsUsingModel1(
  antennaPositions: Position[]
) {
  const positions = new Set<string>();

  const stashedPositions = [...antennaPositions];

  while (stashedPositions.length) {
    const nextAntennaPosition = stashedPositions.shift();
    if (!nextAntennaPosition) {
      break;
    }

    for (const position of stashedPositions) {
      const distanceX = nextAntennaPosition[0] - position[0];
      const distanceY = nextAntennaPosition[1] - position[1];

      const node1Position: Position = [
        nextAntennaPosition[0] + distanceX,
        nextAntennaPosition[1] + distanceY,
      ];
      const node2Position: Position = [
        position[0] - distanceX,
        position[1] - distanceY,
      ];

      positions.add(hashPosition(node1Position));
      positions.add(hashPosition(node2Position));
    }
  }

  return positions;
}

function isInGrid(grid: Grid, position: Position) {
  return grid[position[0]]?.[position[1]] !== undefined;
}

function getUniqueAntennaAntinodePositionsUsingModel2(
  antennaPositions: Position[],
  grid: Grid
) {
  const positions = new Set<string>();

  const stashedPositions = [...antennaPositions];

  while (stashedPositions.length) {
    const nextAntennaPosition = stashedPositions.shift();
    if (!nextAntennaPosition) {
      break;
    }

    for (const position of stashedPositions) {
      // Add the antenna position
      positions.add(hashPosition(nextAntennaPosition));
      positions.add(hashPosition(position));

      const distanceX = nextAntennaPosition[0] - position[0];
      const distanceY = nextAntennaPosition[1] - position[1];

      // Diagonals from nextAntenna
      let nextPosition: Position = [
        nextAntennaPosition[0] + distanceX,
        nextAntennaPosition[1] + distanceY,
      ];

      while (isInGrid(grid, nextPosition)) {
        positions.add(hashPosition(nextPosition));
        nextPosition = [
          nextPosition[0] + distanceX,
          nextPosition[1] + distanceY,
        ];
      }

      // Diagonals from other antenna
      nextPosition = [position[0] - distanceX, position[1] - distanceY];

      while (isInGrid(grid, nextPosition)) {
        positions.add(hashPosition(nextPosition));
        nextPosition = [
          nextPosition[0] - distanceX,
          nextPosition[1] - distanceY,
        ];
      }
    }
  }

  return positions;
}

function getAllUniqueAntennaNodePositions(positionSets: Set<string>[]) {
  const uniquePosition = positionSets.reduce(
    // @ts-ignore
    (acc, next) => acc.union(next),
    new Set<string>()
  );

  return Array.from(uniquePosition.values())
    .toSorted((a, b) => a.localeCompare(b))
    .map(unHashPosition);
}

function getAntennaNodePositions(
  antennas: Map<AntennaId, Position[]>,
  grid: Grid,
  nodePositionCalculator: (positions: Position[], grid: Grid) => Set<string>
) {
  const positionsSets: Set<string>[] = [];

  for (const antenna of antennas.values()) {
    positionsSets.push(nodePositionCalculator(antenna, grid));
  }

  return getAllUniqueAntennaNodePositions(positionsSets);
}

function getAllValidAntennaNodePositions(grid: Grid, positions: Position[]) {
  return positions.filter((position) => isInGrid(grid, position));
}

function part1() {
  console.log("Part 1");
  const grid = getInput();
  const antennas = getAntennas(grid);
  const antinodePositions = getAntennaNodePositions(
    antennas,
    grid,
    getUniqueAntennaAntinodePositionsUsingModel1
  );
  const validPositions = getAllValidAntennaNodePositions(
    grid,
    antinodePositions
  );
  console.log(validPositions.length);
}

function part2() {
  console.log("Part 2");
  const grid = getInput();
  const antennas = getAntennas(grid);
  const antinodePositions = getAntennaNodePositions(
    antennas,
    grid,
    getUniqueAntennaAntinodePositionsUsingModel2
  );
  const validPositions = getAllValidAntennaNodePositions(
    grid,
    antinodePositions
  );
  console.log(validPositions.length);
}

part1();
part2();
