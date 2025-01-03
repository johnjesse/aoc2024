import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

type Towel = string;
type Display = string;
interface Data {
  towels: Towel[];
  displays: Display[];
}

function parseInput(): Data {
  const towels = readFileSync(join(__dirname, "towels-input"))
    .toString()
    .split(", ")
    .map((s) => s.trim());

  const displays = readFileSync(join(__dirname, "displays-input"))
    .toString()
    .split("\n");

  return { towels, displays };
}

function parts() {
  console.log("Part 1");
  const { towels, displays } = parseInput();

  console.log("Part 2");
}

parts();
