import { readFileSync } from "fs";
import { join, parse } from "path";

let memoizedInput: string | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): string {
  const file = readFileSync(join(__dirname, "input")).toString();
  return file;
}

function extractRawMultiplyInstructions(file: string) {
  const multiplicationRegExp = /mul\(\d+,\d+\)/gm;
  const matches = file.match(multiplicationRegExp);

  if (!matches) {
    console.log("No instructions found in file");
  }

  return matches ?? [];
}

function extractRawInstructions(file: string) {
  const instructionRegExp = /(mul\(\d+,\d+\))|(do\(\))|(don't\(\))/gm;
  const matches = file.match(instructionRegExp);

  if (!matches) {
    console.log("No instructions found in file");
  }

  return matches ?? [];
}

type Instruction = MultiplyInstruction | DoInstruction | DontInstruction;

interface MultiplyInstruction {
  type: "command";
  operation: "multiply";
  operands: number[];
}

interface DoInstruction {
  type: "enable-commands";
}

interface DontInstruction {
  type: "disable-commands";
}

function convertToInstruction(rawInstruction: string): Instruction | undefined {
  if (rawInstruction.startsWith("mul")) {
    // Multiply operation
    const rawOperands = rawInstruction.match(/\d+/g);
    if (rawOperands) {
      return {
        type: "command",
        operation: "multiply",
        operands: rawOperands.map((rawNum) => parseInt(rawNum, 10)),
      };
    }
  }

  if (rawInstruction === "do()") {
    return {
      type: "enable-commands",
    };
  }

  if (rawInstruction === "don't()") {
    return {
      type: "disable-commands",
    };
  }

  console.log(`Could not parse instruction ${rawInstruction}`);
}

function isInstruction(value: unknown): value is Instruction {
  if (value && typeof value === "object") {
    const optimisticallyTypedValue = value as Instruction;
    return (
      isDoInstruction(optimisticallyTypedValue) ||
      isDontInstruction(optimisticallyTypedValue) ||
      isMultiplyInstruction(optimisticallyTypedValue)
    );
  }

  return false;
}

function isMultiplyInstruction(
  instruction: Instruction
): instruction is MultiplyInstruction {
  return (
    instruction.type === "command" &&
    instruction.operation === "multiply" &&
    instruction.operands.every(
      (operand) => typeof operand === "number" && !Number.isNaN(operand)
    )
  );
}

function isDoInstruction(
  instruction: Instruction
): instruction is DoInstruction {
  return instruction.type === "enable-commands";
}

function isDontInstruction(
  instruction: Instruction
): instruction is DontInstruction {
  return instruction.type === "disable-commands";
}

function extractInstructions(rawInstructions: string[]): Instruction[] {
  return rawInstructions.map(convertToInstruction).filter(isInstruction);
}

const defaultCommandEnabledState = true;
function followInstructions(instructions: Instruction[]) {
  let commandsEnabled = defaultCommandEnabledState;

  return instructions.reduce((sum, nextInstruction) => {
    switch (nextInstruction.type) {
      case "disable-commands":
        commandsEnabled = false;
        return sum;
      case "enable-commands":
        commandsEnabled = true;
        return sum;
      case "command":
        if (!commandsEnabled) {
          return sum;
        }
        return (
          sum +
          nextInstruction.operands.reduce(
            (product, nextOperand) => nextOperand * product,
            1
          )
        );
    }
  }, 0);
}

function part1() {
  console.log("Part 1");
  const file = getInput();
  const rawInstructions = extractRawMultiplyInstructions(file);
  const instructions = extractInstructions(rawInstructions);
  const endState = followInstructions(instructions);
  console.log(endState);
}

function part2() {
  console.log("Part 2");
  const file = getInput();
  const rawInstructions = extractRawInstructions(file);
  const instructions = extractInstructions(rawInstructions);
  const endState = followInstructions(instructions);
  console.log(endState);
}

part1();
part2();
