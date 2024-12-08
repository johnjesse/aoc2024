import { readFileSync } from "fs";
import { join } from "path";

interface Operation {
  testAnswer: number;
  operands: number[];
}

type Operator = "x" | "+" | "||";

let memoizedInput: Operation[] | undefined = undefined;
function getInput() {
  if (!memoizedInput) {
    memoizedInput = parseInput();
  }

  return memoizedInput;
}

function parseInput(): Operation[] {
  const data = readFileSync(join(__dirname, "input")).toString();
  const rawOperations = data.split("\n");
  const operations = rawOperations.map((rawOperation) => {
    const [rawAnswer, rest] = rawOperation.split(": ");
    const operands = rest.split(" ").map((v) => parseInt(v, 10));
    return {
      testAnswer: parseInt(rawAnswer, 10),
      operands,
    };
  });

  return operations;
}

function operatorGenerator(
  operation: Operation,
  availableOperators: Operator[]
) {
  let operatorPermutationCount = 0;
  const maxPermutation =
    availableOperators.length ** (operation.operands.length - 1) - 1;

  function getNextPermuation() {
    if (operatorPermutationCount > maxPermutation) {
      throw new Error("Got above the max permutation, which should not happen");
    }
    const numOperators = operation.operands.length - 1;
    const order: Operator[] = [];

    for (let i = 0; i < numOperators; i++) {
      const index =
        Math.floor(
          (operatorPermutationCount * availableOperators.length ** (i + 1)) /
            (maxPermutation + 1)
        ) % availableOperators.length;
      order.push(availableOperators[index]);
    }

    return order;
  }

  return {
    getNext() {
      const permuation = getNextPermuation();
      const done = operatorPermutationCount === maxPermutation;
      operatorPermutationCount++;
      return {
        next: permuation,
        done,
      };
    },
  };
}

function isOperationPossible(
  operation: Operation,
  availableOperators: Operator[]
): boolean {
  const generator = operatorGenerator(operation, availableOperators);
  let shouldContinue = true;

  do {
    const { next: operators, done } = generator.getNext();

    // Add a + at the beginning for the reduce, which starts with an value of 0
    operators.unshift("+");

    if (operators.length !== operation.operands.length) {
      throw new Error("Incorrect number of operators or operands");
    }

    const total = operation.operands.reduce(
      (acc, next, index) => applyOperator(acc, next, operators[index]),
      0
    );

    if (total === operation.testAnswer) {
      return true;
    }
    shouldContinue = !done;
  } while (shouldContinue);

  return false;
}

function isOperationPossible2(
  operation: Operation,
  availableOperators: Operator[]
): boolean {
  const combinationsOfOperators: Operator[][] = [];

  const generator = operatorGenerator(operation, availableOperators);
  let shouldContinue = true;

  do {
    const { next: operators, done } = generator.getNext();
    combinationsOfOperators.push(operators);
    shouldContinue = !done;
  } while (shouldContinue);

  const uniqueOperatorCombos = new Set(
    combinationsOfOperators.map((c) => c.join(""))
  );

  if (combinationsOfOperators.length !== uniqueOperatorCombos.size) {
    throw new Error(" we have a sizing inssue");
  }

  console.log(combinationsOfOperators.length, uniqueOperatorCombos.size);

  if (combinationsOfOperators.length !== uniqueOperatorCombos.size) {
    throw new Error("ERROR IN SIZING");
  }
  for (const operators of combinationsOfOperators) {
    // Add a + at the beginning for the reduce, which starts with an value of 0
    operators.unshift("+");

    if (operators.length !== operation.operands.length) {
      throw new Error("Incorrect number of operators or operands");
    }

    const total = operation.operands.reduce(
      (acc, next, index) => applyOperator(acc, next, operators[index]),
      0
    );

    if (total === operation.testAnswer) {
      return true;
    }
  }

  return false;
}

function applyOperator(
  first: number,
  second: number,
  operator: Operator
): number {
  switch (operator) {
    case "+":
      return first + second;
    case "x":
      return first * second;
    case "||":
      return Number(`${first.toString()}${second.toString()}`);
  }
}

function findValidOperations(
  operations: Operation[],
  availableOperators: Operator[]
) {
  return operations.filter((operation, index) => {
    if (isOperationPossible(operation, availableOperators)) {
      return true;
    }

    return false;
  });
}

function sumOperations(operations: Operation[]) {
  return operations.reduce((acc, next) => acc + next.testAnswer, 0);
}

function part1() {
  console.log("Part 1");
  const operations = getInput();
  const operators: Operator[] = ["+", "x"];
  const validOperations = findValidOperations(operations, operators);
  const total = sumOperations(validOperations);
  console.log(total);
}

function part2() {
  console.log("Part 2");
  const operations = getInput();
  const operators: Operator[] = ["+", "x", "||"];
  const validOperations = findValidOperations(operations, operators);
  const total = sumOperations(validOperations);
  console.log(total);
}

part1();
part2();
