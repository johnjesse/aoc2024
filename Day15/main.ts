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
  const movementsData = readFileSync(
    join(__dirname, "movements-input")
  ).toString();
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

  const storeRoomData = readFileSync(
    join(__dirname, "storeroom-input")
  ).toString();
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
  storeRoom: StoreRoom
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
    case "box":
      return canMove(move, nextCell, storeRoom);
  }
}

function move(
  move: Move,
  robot: Robot,
  storeRoom: StoreRoom
): { robot: Robot; storeRoom: StoreRoom } {
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
    case "box":
      return { robot: newRobot, storeRoom: moveBox(move, nextCell, storeRoom) };
    case "wall":
      throw new Error(
        "Shouldn't have tried to move something into a wall, something has gone wrong"
      );
  }
}

function switchPositions(
  spaceCell: Position,
  boxCell: Position,
  storeRoom: StoreRoom
): StoreRoom {
  // Box moves into the space Cell
  // Space moves into the box Cell

  const storeRoomAfterFirstMove = storeRoom.with(
    spaceCell.row,
    storeRoom[spaceCell.row].with(spaceCell.col, {
      type: "box",
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

function moveBox(
  move: Move,
  fromPosition: Position,
  storeRoom: StoreRoom
): StoreRoom {
  // Only call this if the box can move!
  const nextCell = getNextCell(move, fromPosition);

  const storeRoomRow = storeRoom[nextCell.row];
  const cellContent = storeRoomRow?.[nextCell.col];

  if (cellContent.type === "box") {
    // First move the next box
    let nextStoreRoom = moveBox(move, cellContent.position, storeRoom);
    // Now move ourselves into the new space

    return switchPositions(nextCell, fromPosition, nextStoreRoom);
  }

  // Returns a store room with the space where the box was
  return switchPositions(nextCell, fromPosition, storeRoom);
}

function calculateStoreRoomAfterRobotHasDoneAllMoves(
  moves: Movements,
  storeRoom: StoreRoom,
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

function sumBoxPositions(storeRoom: StoreRoom) {
  let totalGPSScore = 0;

  for (const cell of storeRoom.flat()) {
    if (cell.type === "box") {
      const score = 100 * cell.position.row + cell.position.col;
      totalGPSScore = totalGPSScore + score;
    }
  }

  return totalGPSScore;
}

function printStoreRoom(storeRoom: StoreRoom, robot: Robot) {
  console.log("-------------------------------------");

  for (const row of storeRoom) {
    for (const cell of row) {
      switch (cell.type) {
        case "wall":
          process.stdout.write("#");
          break;
        case "box":
          process.stdout.write("O");
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

function part1() {
  console.log("Part 1");
  const data = getInput();
  printStoreRoom(data.storeRoom, data.robot);

  const { storeRoom, robot } = calculateStoreRoomAfterRobotHasDoneAllMoves(
    data.movements,
    data.storeRoom,
    data.robot
  );

  printStoreRoom(storeRoom, robot);

  const totalGPSScore = sumBoxPositions(storeRoom);

  console.log(totalGPSScore);
}

part1();
