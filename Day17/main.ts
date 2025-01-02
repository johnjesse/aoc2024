interface Data {
  registers: {
    a: bigint;
    b: bigint;
    c: bigint;
  };
  program: bigint[];
  stdout: bigint[];
}

type ProramPointer = number;

function getInput(): Data {
  // return {
  //   registers: {
  //     a: 729,
  //     b: 0,
  //     c: 0,
  //   },
  //   program: [0, 1, 5, 4, 3, 0],
  //   stdout: [],
  // };

  return {
    registers: {
      a: 22817223n,
      b: 0n,
      c: 0n,
    },
    program: [2n, 4n, 1n, 2n, 7n, 5n, 4n, 5n, 0n, 3n, 1n, 7n, 5n, 5n, 3n, 0n],
    stdout: [],
  };
}

function getInputPart2() {
  return {
    program: [2n, 4n, 1n, 2n, 7n, 5n, 4n, 5n, 0n, 3n, 1n, 7n, 5n, 5n, 3n, 0n],
    matche: [2n, 4n, 1n, 2n, 7n, 5n, 4n, 5n, 0n, 3n, 1n, 7n, 5n, 5n, 3n, 0n],
  };
}

function getComboOperand(operand: bigint, data: Data) {
  switch (operand) {
    case 0n:
    case 1n:
    case 2n:
    case 3n:
      return operand;
    case 4n:
      return data.registers.a;
    case 5n:
      return data.registers.b;
    case 6n:
      return data.registers.c;
    default:
      throw new Error(`Invalid operand: ${operand}`);
  }
}

interface State {
  data: Data;
  programPointer: ProramPointer;
}

function runInstruction({ data, programPointer }: State): State | undefined {
  const {
    program,
    registers: { a, b, c },
    stdout,
  } = data;
  const instruction = program[programPointer];
  const literalOperand = program[programPointer + 1];

  if (instruction === undefined || literalOperand === undefined) {
    return undefined;
  }

  switch (instruction) {
    case 0n: {
      // adv
      const result = a / 2n ** getComboOperand(literalOperand, data);

      return {
        data: { ...data, registers: { ...data.registers, a: result } },
        programPointer: programPointer + 2,
      };
    }
    case 1n: {
      // bxl
      const result = b ^ literalOperand;

      return {
        data: { ...data, registers: { ...data.registers, b: result } },
        programPointer: programPointer + 2,
      };
    }
    case 2n: {
      // bst
      const result = getComboOperand(literalOperand, data) % 8n;
      return {
        data: { ...data, registers: { ...data.registers, b: result } },
        programPointer: programPointer + 2,
      };
    }
    case 3n: {
      // jnz
      return {
        data,
        programPointer: a === 0n ? programPointer + 2 : Number(literalOperand),
      };
    }
    case 4n: {
      // bxc
      const result = b ^ c;

      return {
        data: { ...data, registers: { ...data.registers, b: result } },
        programPointer: programPointer + 2,
      };
    }
    case 5n: {
      // out
      const value = getComboOperand(literalOperand, data) % 8n;
      return {
        data: {
          ...data,
          stdout: [...stdout, value],
        },
        programPointer: programPointer + 2,
      };
    }
    case 6n: {
      // bdv
      const result = a / 2n ** getComboOperand(literalOperand, data);

      return {
        data: { ...data, registers: { ...data.registers, b: result } },
        programPointer: programPointer + 2,
      };
    }
    case 7n: {
      // cdv
      const result = a / 2n ** getComboOperand(literalOperand, data);

      return {
        data: { ...data, registers: { ...data.registers, c: result } },
        programPointer: programPointer + 2,
      };
    }
  }
}

function runProgram(data: Data) {
  let state: State | undefined = { data, programPointer: 0 };
  let previousState = state;

  do {
    previousState = state;
    const nextState = runInstruction(state);

    state = nextState;
  } while (state !== undefined);

  return previousState;
}

function part1() {
  console.log("Part 1");
  const data = getInput();
  const state = runProgram(data);
  console.log(state.data.stdout);
  console.log(state.data.stdout.map((o) => o.toString()).join(","));
}

function searchForStartValue(instructions: bigint[], matches: bigint[]) {
  let a = 0n;

  for (let i = matches.length - 1; i >= 0; i--) {
    const currentMatches = matches.slice(i);
    const stringMatch = currentMatches.join(",");
    let result = "";

    a = a * 8n;
    let acount = 0;
    do {
      const programResult = runProgram({
        program: instructions,
        stdout: [],
        registers: { b: 0n, c: 0n, a },
      });

      if (programResult.data.stdout.length !== currentMatches.length) {
        throw new Error("Something has gone badly wrong");
      }

      result = programResult.data.stdout.join(",");

      if (result !== stringMatch) {
        a++;
        acount++;
      }
    } while (currentMatches.join(",") !== result);
  }

  return a;
}

function part2() {
  console.log("Part 2");
  const data = getInputPart2();

  const startValue = searchForStartValue(data.program, data.matche);
  console.log(startValue);
}

part1();
part2();
