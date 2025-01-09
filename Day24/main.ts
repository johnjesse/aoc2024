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

  return parseInt(orderedBits.map((b) => b.value.toString()).join(""), 2);
}

function part1() {
  console.log("Part 1");
  const { gates, inputs } = parseInput();
  const solution = solveCircuit(inputs, gates);
  const znumber = getZBits(solution);
  console.log(znumber);
}

// This is a Full Adder System
// https://en.wikipedia.org/wiki/Adder_(electronics)
//
// Each Bitwise addition includes inputs:
//   The Xn bit to add
//   The Yn bit to add
//   The Cin carried in bit - overflow from the n-1 addition
// and outputs
//   The Zn bit
//   The Cout bit - overflow from this addition
//
//  X_n --------------\----| XOR |--\---| XOR |-------------------- Z_n
//                     \  /          \ /
//                      \/            /
//                      /\           / \
//                     /  \         /   \
//  Y_n --------------/----| AND |----------------------| OR |----- Cout_n / Cin_n+1
//                                /       \            /
//                               /         \          /
//                              /           | AND |--/
//                             /           /
//  Cin_n / Cout_n-1 ---------/-----------/
//
//
// | X_n | Y_n | Cin | Z_n | Cout |
// |-----|-----|-----|-----|------|
// |  0  |  0  |  0  |  0  |  0   |
// |  1  |  0  |  0  |  1  |  0   |
// |  0  |  1  |  0  |  1  |  0   |
// |  1  |  1  |  0  |  0  |  1   |
// |  0  |  0  |  1  |  1  |  0   |
// |  1  |  0  |  1  |  0  |  1   |
// |  0  |  1  |  1  |  0  |  1   |
// |  1  |  1  |  1  |  1  |  1   |
//
// So use can use this to associate a set of 5 gates with each bit
// Note for Z00 -> there are only 2 gates because Cin = 0
// And for Z45 there is no gate because - it is just the carry over from the 44th bit addition
//
// So 45 bits -> (44 * 5) + 2 = 222 gates
//
// For Z00 we expect two gates (half adder)
// X00 XOR YOO = Z00
// XOO AND YOO = Cout_00
//
// For Zn we expect 5 gates (full adder)
// Xn XOR Yn = An
// An XOR Cout_n-1 = Zn
// Xn AND Yn = Dn
// An AND Count_n-1 = En
// Dn OR En = Cout_n
//
// For Z45 we expect 1 gate
// D44 OR E44 = Z45
//
// So Separate out the gates into their bitwise groups based on the above - and then look for errors,
// this should give us candidate gates that need their outputs swapping

interface Group {
  bit: number;
  gates: {
    a?: Gate;
    z?: Gate;
    d?: Gate;
    e?: Gate;
    cout?: Gate;
  };
}

function interrogateGates(gates: Gate[]) {
  const groups: Group[] = [];

  function findAn(bit: string) {
    console.log("finding A");
    return gates.find((gate) => {
      const isxor = gate.type === "XOR";
      const hasX = gate.operands.find((o) => o === `x${bit}`);
      const hasY = gate.operands.find((o) => o === `y${bit}`);
      return isxor && hasX && hasY;
    });
  }

  function findDn(bit: string) {
    console.log("finding D");
    return gates.find((gate) => {
      const isand = gate.type === "AND";
      const hasX = gate.operands.find((o) => o === `x${bit}`);
      const hasY = gate.operands.find((o) => o === `y${bit}`);
      return isand && hasX && hasY;
    });
  }

  function findZ(a: string, cin: string) {
    console.log("finding Z");
    return gates.find((gate) => {
      const isxor = gate.type === "XOR";
      const hasA = gate.operands.find((o) => o === a);
      const hasCin = gate.operands.find((o) => o === cin);
      return isxor && hasA && hasCin;
    });
  }

  function findEn(a: string, cin: string) {
    console.log("finding E");
    return gates.find((gate) => {
      const isand = gate.type === "AND";
      const hasA = gate.operands.find((o) => o === a);
      const hasCin = gate.operands.find((o) => o === cin);
      return isand && hasA && hasCin;
    });
  }

  function findCout(d: string, e: string) {
    console.log("finding Cout");
    return gates.find((gate) => {
      const isand = gate.type === "OR";
      const hasD = gate.operands.find((o) => o === d);
      const hasE = gate.operands.find((o) => o === e);
      return isand && hasD && hasE;
    });
  }

  let previousCout = "";
  for (let i = 0; i <= 44; i++) {
    console.log("i", i);
    if (i === 0) {
      const a = findAn("00");
      const z = a;
      const d = findDn("00");
      const cout = d;
      const group: Group = { bit: i, gates: { a, z, d, cout } };
      groups.push(group);
      console.log(group);
      previousCout = cout?.output ?? "";
    }

    if (i >= 1 && i < 10) {
      // single digit bit
      const bit = `0${i}`;
      const a = findAn(bit);
      const z = a ? findZ(a.output, previousCout) : undefined;
      const d = findDn(bit);
      const e = a ? findEn(a.output, previousCout) : undefined;
      const cout = d && e ? findCout(d.output, e.output) : undefined;
      const group: Group = { bit: i, gates: { a, z, d, e, cout } };
      groups.push(group);
      console.log(group);
      previousCout = cout?.output ?? "";
    }

    if (i >= 10) {
      // single digit bit
      const bit = i.toString();
      const a = findAn(bit);
      const z = a ? findZ(a.output, previousCout) : undefined;
      const d = findDn(bit);
      const e = a ? findEn(a.output, previousCout) : undefined;
      const cout = d && e ? findCout(d.output, e.output) : undefined;
      const group: Group = { bit: i, gates: { a, z, d, e, cout } };
      groups.push(group);
      console.log(group);
      previousCout = cout?.output ?? "";
    }
  }

  return groups;
}

function part2() {
  console.log("Part 2");
  const { gates } = parseInput();

  // This outputs the groups of gates in their full/half adder configurations
  // It's then a job of looking where that configuration breaks - at which _bit_
  // and seeing - usually pretty trivially - which wires have been switched
  //
  // For my input -> `cph,jqn,kwb,qkf,tgr,z12,z16,z24`
  const groups = interrogateGates(gates);
}

part1();
part2();
