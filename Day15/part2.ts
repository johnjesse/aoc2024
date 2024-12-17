import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

type Move = "up" | "down" | "left" | "right";
type Movements = Move[];
interface Position {
  row: number;
  col: number;
}

interface Wall {
  type: "wall";
  position: Position;
}

interface Box {
  type: "box";
  position: Position;
}

interface LeftSideOfBox {
  type: "left-box";
  position: Position;
}
interface RightSideOfBox {
  type: "right-box";
  position: Position;
}

interface Space {
  type: "space";
  position: Position;
}

interface Robot {
  type: "robot";
  position: Position;
}

type StoreRoomCell = Wall | Box | Space;
type BigStoreRoomCell = Wall | LeftSideOfBox | RightSideOfBox | Space;
type StoreRoom = StoreRoomCell[][];
type BigStoreRoom = BigStoreRoomCell[][];

interface Data {
  storeRoom: StoreRoom;
  movements: Movements;
  robot: Robot;
}

let memoizedInput: Data | undefined = undefined;

function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Data {
  const movementsData = readFileSync(join(__dirname, "movements")).toString();
  const movements = movementsData
    .split("\n")
    .flatMap((row) => row.split(""))
    .map((value) => {
      switch (value) {
        case "v":
          return "down";
        case "^":
          return "up";
        case "<":
          return "left";
        case ">":
          return "right";
        default:
          throw new Error(`unparsable ${value}`);
      }
    });

  const storeRoomData = readFileSync(join(__dirname, "storeroom")).toString();
  const rows = storeRoomData.split("\n").map((row) => row.split(""));

  let robot: Robot | undefined;

  const storeRoom: StoreRoom = rows.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const newCell = getCellFromStringAndIndices(cell, rowIndex, colIndex);
      if (cell === "@") {
        robot = { ...newCell, type: "robot" };
      }

      return newCell;
    })
  );

  if (!robot) {
    throw new Error("Parsing error, could not find robot");
  }

  return { movements, storeRoom, robot };
}

function getCellFromStringAndIndices(
  value: string,
  row: number,
  col: number
): StoreRoomCell {
  const position = { row, col };
  switch (value) {
    case "#":
      return { type: "wall", position } as const;
    case "O":
      return { type: "box", position } as const;
    case "@":
      // deliberates store the Robots space as empty in the store room
      return { type: "space", position };
    default:
      return { type: "space", position };
  }
}

function getNextCell(move: Move, { row, col }: Position) {
  switch (move) {
    case "down":
      return { row: row + 1, col };
    case "up":
      return { row: row - 1, col };
    case "left":
      return { row, col: col - 1 };
    case "right":
      return { row, col: col + 1 };
  }
}

function canMove(
  move: Move,
  robotPosition: Position,
  storeRoom: BigStoreRoom
): boolean {
  const nextCell = getNextCell(move, robotPosition);

  const cellContents = storeRoom[nextCell.row]?.[nextCell.col];

  if (!cellContents) {
    // Outside the grid
    return false;
  }

  switch (cellContents.type) {
    case "space":
      return true;
    case "wall":
      return false;
    case "left-box":
      switch (move) {
        case "right":
          // got to check 2 from robot, not one for a horizontal move
          return canMove(move, getNextCell(move, nextCell), storeRoom);
        case "left":
          return canMove(move, nextCell, storeRoom);
        case "down":
        case "up":
          // Need to check we can move both halves of the box up and down
          return (
            canMove(move, nextCell, storeRoom) &&
            canMove(move, { ...nextCell, col: nextCell.col + 1 }, storeRoom)
          );
      }
    case "right-box":
      switch (move) {
        case "left":
          // got to check 2 from robot, not one for a horizontal move
          return canMove(move, getNextCell(move, nextCell), storeRoom);
        case "right":
          return canMove(move, nextCell, storeRoom);
        case "down":
        case "up":
          // Need to check we can move both halves of the box up and down
          return (
            canMove(move, nextCell, storeRoom) &&
            canMove(move, { ...nextCell, col: nextCell.col - 1 }, storeRoom)
          );
      }
  }
}

function move(
  move: Move,
  robot: Robot,
  storeRoom: BigStoreRoom
): { robot: Robot; storeRoom: BigStoreRoom } {
  if (!canMove(move, robot.position, storeRoom)) {
    return { robot, storeRoom };
  }

  const nextCell = getNextCell(move, robot.position);
  const newRobot = { type: "robot" as const, position: nextCell };

  const cellContent = storeRoom[nextCell.row]?.[nextCell.col];

  switch (cellContent.type) {
    case "space":
      // Store room doesn't change - the robot just goes from one space to another
      return { storeRoom, robot: newRobot };
    case "left-box":
      if (move === "left" || move === "right") {
        return {
          robot: newRobot,
          storeRoom: pushLeftSideOfBox(move, nextCell, storeRoom),
        };
      }

      return {
        robot: newRobot,
        storeRoom: pushRightSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col + 1 },
          pushLeftSideOfBox(move, nextCell, storeRoom)
        ),
      };
    case "right-box":
      if (move === "left" || move === "right") {
        return {
          robot: newRobot,
          storeRoom: pushRightSideOfBox(move, nextCell, storeRoom),
        };
      }
      return {
        robot: newRobot,
        storeRoom: pushLeftSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col - 1 },
          pushRightSideOfBox(move, nextCell, storeRoom)
        ),
      };
    case "wall":
      throw new Error(
        "Shouldn't have tried to move something into a wall, something has gone wrong"
      );
  }
}

function pushLeftSideOfBox(
  move: Move,
  cell: Position,
  storeRoom: BigStoreRoom
): BigStoreRoom {
  const nextCell = getNextCell(move, cell);
  const nextCellContent = storeRoom[nextCell.row]?.[nextCell.col];

  switch (move) {
    case "left": {
      if (nextCellContent.type === "right-box") {
        let newStoreRoom = pushRightSideOfBox(move, nextCell, storeRoom);
        return switchPositions(nextCell, cell, newStoreRoom);
      }
      return switchPositions(nextCell, cell, storeRoom);
    }
    case "right": {
      const newStoreRoom = pushRightSideOfBox(move, nextCell, storeRoom);
      return switchPositions(nextCell, cell, newStoreRoom);
    }
    case "up":
    case "down": {
      if (nextCellContent.type === "right-box") {
        let newStoreRoom = pushRightSideOfBox(move, nextCell, storeRoom);
        newStoreRoom = pushLeftSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col - 1 },
          newStoreRoom
        );
        return switchPositions(nextCell, cell, newStoreRoom);
      }

      if (nextCellContent.type === "left-box") {
        let newStoreRoom = pushLeftSideOfBox(move, nextCell, storeRoom);
        newStoreRoom = pushRightSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col + 1 },
          newStoreRoom
        );
        return switchPositions(nextCell, cell, newStoreRoom);
      }
      return switchPositions(nextCell, cell, storeRoom);
    }
  }
}

function pushRightSideOfBox(
  move: Move,
  cell: Position,
  storeRoom: BigStoreRoom
): BigStoreRoom {
  const nextCell = getNextCell(move, cell);
  const nextCellContent = storeRoom[nextCell.row]?.[nextCell.col];

  switch (move) {
    case "left": {
      const newStoreRoom = pushLeftSideOfBox(move, nextCell, storeRoom);
      return switchPositions(nextCell, cell, newStoreRoom);
    }
    case "right":
      if (nextCellContent.type === "left-box") {
        const newStoreRoom = pushLeftSideOfBox(move, nextCell, storeRoom);
        return switchPositions(nextCell, cell, newStoreRoom);
      }
      return switchPositions(nextCell, cell, storeRoom);
    case "up":
    case "down":
      if (nextCellContent.type === "right-box") {
        let newStoreRoom = pushRightSideOfBox(move, nextCell, storeRoom);
        newStoreRoom = pushLeftSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col - 1 },
          newStoreRoom
        );
        return switchPositions(nextCell, cell, newStoreRoom);
      }

      if (nextCellContent.type === "left-box") {
        let newStoreRoom = pushLeftSideOfBox(move, nextCell, storeRoom);
        newStoreRoom = pushRightSideOfBox(
          move,
          { row: nextCell.row, col: nextCell.col + 1 },
          newStoreRoom
        );
        return switchPositions(nextCell, cell, newStoreRoom);
      }
      return switchPositions(nextCell, cell, storeRoom);
  }
}

function switchPositions(
  spaceCell: Position,
  boxCell: Position,
  storeRoom: BigStoreRoom
): BigStoreRoom {
  // Box moves into the space Cell
  // Space moves into the box Cell
  const boxCellType = storeRoom[boxCell.row]?.[boxCell.col]!.type;

  const storeRoomAfterFirstMove = storeRoom.with(
    spaceCell.row,
    storeRoom[spaceCell.row].with(spaceCell.col, {
      type: boxCellType,
      position: spaceCell,
    })
  );

  return storeRoomAfterFirstMove.with(
    boxCell.row,
    storeRoomAfterFirstMove[boxCell.row].with(boxCell.col, {
      type: "space",
      position: boxCell,
    })
  );
}

function calculateStoreRoomAfterRobotHasDoneAllMoves(
  moves: Movements,
  storeRoom: BigStoreRoom,
  robot: Robot
) {
  let currentStoreRoom = storeRoom;
  let currentRobot = robot;

  while (moves.length) {
    const nextMove = moves.shift();

    if (!nextMove) {
      break;
    }

    ({ storeRoom: currentStoreRoom, robot: currentRobot } = move(
      nextMove,
      currentRobot,
      currentStoreRoom
    ));
  }

  return { storeRoom: currentStoreRoom, robot: currentRobot };
}

function sumBoxPositions(storeRoom: BigStoreRoom) {
  let totalGPSScore = 0;
  const storeRoomWidth = storeRoom[0].length;
  const storeRoomLength = storeRoom.length;
  console.log(storeRoomWidth, storeRoomLength);

  for (const cell of storeRoom.flat()) {
    if (cell.type === "left-box") {
      const leftDistance = cell.position.col;
      const topDistance = cell.position.row;
      const score = leftDistance + 100 * topDistance;
      totalGPSScore = totalGPSScore + score;
    }
  }

  return totalGPSScore;
}

function resizeStoreRoom(storeRoom: StoreRoom): BigStoreRoom {
  return storeRoom.map((row) =>
    row.flatMap((cell) => [
      {
        type: cell.type === "box" ? "left-box" : cell.type,
        position: {
          ...cell.position,
          col: cell.position.col * 2,
        },
      },
      {
        type: cell.type === "box" ? "right-box" : cell.type,
        position: {
          ...cell.position,
          col: cell.position.col * 2 + 1,
        },
      },
    ])
  );
}

function printBigStoreRoom(storeRoom: BigStoreRoom, robot: Robot) {
  console.log("-------------------------------------");

  for (const row of storeRoom) {
    for (const cell of row) {
      switch (cell.type) {
        case "wall":
          process.stdout.write("#");
          break;
        case "left-box":
          process.stdout.write("[");
          break;
        case "right-box":
          process.stdout.write("]");
          break;
        case "space":
          if (
            cell.position.col === robot.position.col &&
            cell.position.row === robot.position.row
          ) {
            process.stdout.write("@");
          } else {
            process.stdout.write(".");
          }
          break;
      }
    }
    process.stdout.write("\n");
  }

  console.log("-------------------------------------");
}

async function part2() {
  console.log("Part 2");
  const data = getInput();
  const storeRoom = resizeStoreRoom(data.storeRoom);
  const robot = {
    ...data.robot,
    position: { ...data.robot.position, col: data.robot.position.col * 2 },
  };
  printBigStoreRoom(storeRoom, robot);

  const { storeRoom: finalStoreRoom, robot: finalRobot } =
    calculateStoreRoomAfterRobotHasDoneAllMoves(
      data.movements,
      storeRoom,
      robot
    );

  printBigStoreRoom(finalStoreRoom, finalRobot);

  const totalGPSScore = sumBoxPositions(finalStoreRoom);

  console.log(totalGPSScore);
}

part2();
