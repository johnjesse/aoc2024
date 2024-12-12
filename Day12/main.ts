import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

let memoizedInput: Grid | undefined = undefined;

type Grid = string[][];
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Grid {
  const data = readFileSync(join(__dirname, "input")).toString();
  return data.split("\n").map((value) => value.split(""));
}

type Position = readonly [number, number];

interface Plot {
  cells: Position[];
  type: string;
}

function hashPosition(position: Position) {
  return `${position[0]}-${position[1]}`;
}

function hashCellEdge(
  cell: Position,
  edge: "north" | "south" | "east" | "west"
) {
  return `${hashPosition(cell)}-${edge}`;
}

function getPlots(grid: Grid): Plot[] {
  const alreadyVisitedPositions = new Set<string>();

  const plots: Plot[] = [];

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];

    for (let j = 0; j < row.length; j++) {
      if (alreadyVisitedPositions.has(hashPosition([i, j]))) {
        continue;
      }

      const position = [i, j] as const;

      alreadyVisitedPositions.add(hashPosition([i, j]));

      const cells = [
        position,
        ...getAdjacentMatchingCells(position, grid, alreadyVisitedPositions),
      ];

      plots.push({
        cells,
        type: getCellValue(grid, position),
      });
    }
  }

  return plots;
}

function getCellValue(grid: Grid, position: Position) {
  return grid[position[0]]?.[position[1]];
}

type BoundaryType = "north" | "east" | "south" | "west";

function getImmediatelyAdjacentPositions(
  position: Position
): { position: Position; boundary: BoundaryType }[] {
  const north = [position[0] - 1, position[1]] as const;
  const east = [position[0], position[1] + 1] as const;
  const south = [position[0] + 1, position[1]] as const;
  const west = [position[0], position[1] - 1] as const;

  return [
    { boundary: "north", position: north },
    { boundary: "east", position: east },
    { boundary: "south", position: south },
    { boundary: "west", position: west },
  ];
}

function getAdjacentMatchingCells(
  position: Position,
  grid: Grid,
  previousPositions: Set<string>
): Position[] {
  const adjacentMatchingCells: Position[] = [];

  const currentCell = getCellValue(grid, position);
  const immediatedlyAdjacentCells = getImmediatelyAdjacentPositions(position);

  for (const adjacentCell of immediatedlyAdjacentCells) {
    const adjacentCellPosition = adjacentCell.position;
    if (
      !previousPositions.has(hashPosition(adjacentCellPosition)) &&
      getCellValue(grid, adjacentCellPosition) === currentCell
    ) {
      previousPositions.add(hashPosition(adjacentCellPosition));

      adjacentMatchingCells.push(
        adjacentCellPosition,
        ...getAdjacentMatchingCells(
          adjacentCellPosition,
          grid,
          previousPositions
        )
      );
    }
  }

  return adjacentMatchingCells;
}

function getPerimeter(plot: Plot) {
  const cellInPlotLookup = new Set(plot.cells.map(hashPosition));

  let perimeter = 0;

  for (const position of plot.cells) {
    const immediatedlyAdjacentCells = getImmediatelyAdjacentPositions(position);
    for (const cell of immediatedlyAdjacentCells) {
      const adjacentCellPosition = cell.position;
      if (!cellInPlotLookup.has(hashPosition(adjacentCellPosition))) {
        perimeter++;
      }
    }
  }

  return perimeter;
}

function getSides(plot: Plot): number {
  const cellInPlotLookup = new Set(plot.cells.map(hashPosition));

  const cellsOnPerimeter = new Set<Position>();
  const edgesOnPerimeter = new Set<string>();

  for (const position of plot.cells) {
    const immediatedlyAdjacentCells = getImmediatelyAdjacentPositions(position);

    for (const cell of immediatedlyAdjacentCells) {
      if (!cellInPlotLookup.has(hashPosition(cell.position))) {
        cellsOnPerimeter.add(position);
        edgesOnPerimeter.add(hashCellEdge(position, cell.boundary));
      }
    }
  }

  function cellHasEdgeToThe(cell: Position, type: BoundaryType) {
    return edgesOnPerimeter.has(hashCellEdge(cell, type));
  }

  const edges: Position[][] = [];
  const edgeSet = new Set<string>();

  for (const cellOnPerimeter of cellsOnPerimeter.values()) {
    const adjacentCells = getImmediatelyAdjacentPositions(cellOnPerimeter);

    for (const adjacentCell of adjacentCells) {
      if (
        !cellInPlotLookup.has(hashPosition(adjacentCell.position)) &&
        !edgeSet.has(hashCellEdge(cellOnPerimeter, adjacentCell.boundary))
      ) {
        const edge = [cellOnPerimeter];

        switch (adjacentCell.boundary) {
          case "north":
          case "south": {
            let nextCell: Position = [
              cellOnPerimeter[0],
              cellOnPerimeter[1] + 1,
            ];
            edgeSet.add(hashCellEdge(cellOnPerimeter, adjacentCell.boundary));

            // Go East
            while (cellHasEdgeToThe(nextCell, adjacentCell.boundary)) {
              edge.push(nextCell);
              edgeSet.add(hashCellEdge(nextCell, adjacentCell.boundary));
              nextCell = [nextCell[0], nextCell[1] + 1];
            }

            nextCell = [cellOnPerimeter[0], cellOnPerimeter[1] - 1];

            // Go West
            while (cellHasEdgeToThe(nextCell, adjacentCell.boundary)) {
              edge.push(nextCell);
              edgeSet.add(hashCellEdge(nextCell, adjacentCell.boundary));
              nextCell = [nextCell[0], nextCell[1] - 1];
            }

            edges.push(edge);
            break;
          }

          case "east":
          case "west": {
            edgeSet.add(hashCellEdge(cellOnPerimeter, adjacentCell.boundary));

            let nextCell: Position = [
              cellOnPerimeter[0] + 1,
              cellOnPerimeter[1],
            ];

            // Go North
            while (cellHasEdgeToThe(nextCell, adjacentCell.boundary)) {
              edge.push(nextCell);
              edgeSet.add(hashCellEdge(nextCell, adjacentCell.boundary));
              nextCell = [nextCell[0] + 1, nextCell[1]];
            }

            nextCell = [cellOnPerimeter[0] - 1, cellOnPerimeter[1]];

            // Go South
            while (cellHasEdgeToThe(nextCell, adjacentCell.boundary)) {
              edge.push(nextCell);
              edgeSet.add(hashCellEdge(nextCell, adjacentCell.boundary));
              nextCell = [nextCell[0] - 1, nextCell[1]];
            }

            edges.push(edge);
            break;
          }
        }
      }
    }
  }

  return edges.length;
}

function calculatePlotValue(plot: Plot, type: "perimeter" | "sides") {
  const multiplier = type === "perimeter" ? getPerimeter(plot) : getSides(plot);
  const area = plot.cells.length;
  const cost = multiplier * area;
  return cost;
}

function part1() {
  console.log("Part 1");
  const grid = getInput();
  const plots = getPlots(grid);
  const total = plots.reduce(
    (acc, next) => acc + calculatePlotValue(next, "perimeter"),
    0
  );
  console.log(total);
}

function part2() {
  console.log("Part 2");
  const grid = getInput();
  const plots = getPlots(grid);
  const total = plots.reduce(
    (acc, next) => acc + calculatePlotValue(next, "sides"),
    0
  );
  console.log(total);
}

part1();
part2();
