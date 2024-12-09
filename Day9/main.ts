import { readFileSync } from "fs";
import { join } from "path";

interface FileBlock {
  type: "file";
  id: number;
  length: number;
}

interface SpaceBlock {
  type: "space";
  length: number;
}

type DiskMap = (FileBlock | SpaceBlock)[];

let memoizedInput: DiskMap | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): DiskMap {
  const data = readFileSync(join(__dirname, "input")).toString();
  const rawDiskMap = data.split("").map((val) => parseInt(val, 10));

  let lastEntryWasFreeSpace = true;
  let nextFileId = 0;
  const diskMap: DiskMap = [];

  for (const entry of rawDiskMap) {
    for (let i = 0; i < entry; i++) {
      diskMap.push(
        lastEntryWasFreeSpace
          ? { type: "file", id: nextFileId, length: 1 }
          : { type: "space", length: 1 }
      );
    }

    if (lastEntryWasFreeSpace) {
      nextFileId++;
    }

    lastEntryWasFreeSpace = !lastEntryWasFreeSpace;
  }
  return diskMap;
}

function compressDiskMapWithFragmentation(diskMap: DiskMap): FileBlock[] {
  const data = [...diskMap];

  const rearranged: FileBlock[] = [];

  while (data.length) {
    const value = data.shift()!;
    switch (value.type) {
      case "file":
        rearranged.push(value);
        break;

      case "space": {
        let lastFileBlock: FileBlock | undefined;

        while (lastFileBlock === undefined && data.length) {
          const next = data.pop();
          lastFileBlock = next?.type === "file" ? next : undefined;
        }
        if (lastFileBlock) {
          rearranged.push(lastFileBlock);
        }
        break;
      }
    }
  }

  return rearranged;
}

function isSpaceBlock(block: FileBlock | SpaceBlock): block is SpaceBlock {
  return block.type === "space";
}

function compressDiskMapWithoutFragmentation(diskMap: DiskMap): DiskMap {
  const data = [...diskMap];

  let collapsed: (FileBlock | SpaceBlock)[] = [];

  let lastBlock: (FileBlock | SpaceBlock) | undefined;

  for (const block of diskMap) {
    if (
      (block.type === "space" && lastBlock?.type === "space") ||
      (block.type === "file" &&
        lastBlock?.type === "file" &&
        block.id === lastBlock.id)
    ) {
      lastBlock = { ...lastBlock, length: lastBlock.length + block.length };
    } else {
      if (lastBlock) {
        collapsed.push(lastBlock);
      }
      lastBlock = { ...block };
    }
  }
  collapsed.push(lastBlock!);

  let nextId = collapsed.findLast((i) => i.type === "file")?.id || 0;

  while (nextId > 0) {
    const fileToMove = collapsed.findLast(
      (i) => i.type === "file" && i.id === nextId
    )!;
    const indexOfFile = collapsed.findIndex((i) => i === fileToMove);

    const firstAvailableSpace = collapsed.find(
      (i) => isSpaceBlock(i) && i.length >= fileToMove.length
    ) as SpaceBlock | undefined;

    const indexOfSpace = collapsed.findIndex((i) => i === firstAvailableSpace);

    if (
      !firstAvailableSpace ||
      indexOfSpace === -1 ||
      indexOfSpace >= indexOfFile
    ) {
      nextId--;
      continue;
    }

    // Note - order here matters - we remove the file first from it's position in the array so we can avoid
    // doing index calculations if we did the insertion first

    if (firstAvailableSpace.length === fileToMove.length) {
      // space is same size of file WOOT!
      collapsed = collapsed
        .toSpliced(indexOfFile, 1, { length: fileToMove.length, type: "space" })
        .with(indexOfSpace, fileToMove);
    } else {
      // need to insert file AND new contracted space
      const newSpace: SpaceBlock = {
        ...firstAvailableSpace,
        length: firstAvailableSpace.length - fileToMove.length,
      };
      collapsed = collapsed
        .toSpliced(indexOfFile, 1, { length: fileToMove.length, type: "space" })
        .with(indexOfSpace, fileToMove)
        .toSpliced(indexOfSpace + 1, 0, newSpace);
    }
    nextId--;
  }

  return collapsed;
}

function getCheckSum(diskMap: DiskMap) {
  let expandedDiskMap: DiskMap = [];

  // expand map so that each block is 1 length long as _index_ is used to calculate the checksum
  for (const block of diskMap) {
    for (let i = 0; i < block.length; i++) {
      expandedDiskMap.push({ ...block, length: 1 });
    }
  }

  return expandedDiskMap.reduce(
    (acc, next, index) => acc + (next.type === "file" ? next.id * index : 0),
    0
  );
}

function part1() {
  console.log("Part 1");
  const diskMap = getInput();
  const compressed = compressDiskMapWithFragmentation(diskMap);
  const checksum = getCheckSum(compressed);
  console.log(checksum);
}

function part2() {
  console.log("Part 2");

  const diskMap = getInput();
  const compressed = compressDiskMapWithoutFragmentation(diskMap);
  const checksum = getCheckSum(compressed);
  console.log(checksum);
}

part1();
part2();
