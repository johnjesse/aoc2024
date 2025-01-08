import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

interface LogicalInputs {
  [key: string]: 0 | 1;
}

interface Gate {
  type: "AND" | "OR" | "XOR";
  operands: [string, string];
  output: string;
}

function parseInput(): { inputs: LogicalInputs; gates: Gate[] } {
  const inputsRaw = readFileSync(join(__dirname, "logical-input")).toString();

  const inputs: LogicalInputs = {};
  inputsRaw.split("\n").forEach((row) => {
    const [key, value] = row.split(": ");
    inputs[key] = value === "0" ? 0 : 1;
  });

  const gatesRaw = readFileSync(join(__dirname, "gate-input")).toString();

  const gates = gatesRaw.split("\n").map((row) => {
    const [first, second, result] = row.match(/[a-z][a-z0-9][a-z0-9]/gm)!;
    const [type] = row.match(/AND|OR|XOR/gm)!;

    return { type, operands: [first, second], output: result } as Gate;
  });

  return { inputs, gates };
}
function solveGate(
  type: "AND" | "OR" | "XOR",
  [first, second]: [0 | 1, 0 | 1]
): 1 | 0 {
  switch (type) {
    case "AND":
      return first === 1 && second === 1 ? 1 : 0;
    case "OR":
      return first === 1 || second === 1 ? 1 : 0;
    case "XOR":
      return (first === 1 && second === 0) || (first === 0 && second === 1)
        ? 1
        : 0;
  }
}

function solveCircuit(inputs: LogicalInputs, gates: Gate[]) {
  const inputMap = new Map(Object.entries(inputs));

  let unresolvedGates = [...gates];

  while (unresolvedGates.length > 0) {
    const nextGates = [];
    for (const gate of unresolvedGates) {
      const first = inputMap.get(gate.operands[0]);
      const second = inputMap.get(gate.operands[1]);

      if (first !== undefined && second !== undefined) {
        // hooray we can solve it
        inputMap.set(gate.output, solveGate(gate.type, [first, second]));
      } else {
        nextGates.push(gate);
      }
    }

    unresolvedGates = nextGates;
  }

  return inputMap;
}

function getZBits(inputs: Map<string, 0 | 1>) {
  const zBits: { key: string; order: number; value: 0 | 1 }[] = [];

  for (const [key, value] of inputs.entries()) {
    if (key.startsWith("z")) {
      const order = parseInt(key.substring(1), 10);
      zBits.push({ key, order, value });
    }
  }

  const orderedBits = zBits.toSorted((a, b) => b.order - a.order);
  console.log(orderedBits);

  return parseInt(orderedBits.map((b) => b.value.toString()).join(""), 2);
}

function part1() {
  console.log("Part 1");
  const { gates, inputs } = parseInput();
  const solution = solveCircuit(inputs, gates);
  const znumber = getZBits(solution);
  console.log(znumber);
}

// function part2() {
//   console.log("Part 2");
//   const connections = parseInput();
//   const biggestSet = getBiggestSetsOfInterconnectedComputers(connections);
//   console.log(biggestSet);
// }

part1();
// part2();
