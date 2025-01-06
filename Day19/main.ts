import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

type Towel = string;
type Design = string;
interface Data {
  towels: Towel[];
  designs: Design[];
}

function parseInput(): Data {
  const towels = readFileSync(join(__dirname, "towels-input"))
    .toString()
    .split(", ")
    .map((s) => s.trim());

  const designs = readFileSync(join(__dirname, "displays-input"))
    .toString()
    .split("\n");

  return { towels, designs };
}

function isDesignPossible(
  design: Design,
  towels: Towel[],
  cache: Set<string>,
  fromStart: boolean
): boolean {
  if (design === "" || cache.has("design")) {
    return true;
  }

  // // Do a quick sanity check before recursing further
  // const hasTowelMatchingStart = towels.find((towel) =>
  //   design.startsWith(towel)
  // );
  // const hasTowelMatchingEnd = towels.find((towel) => design.endsWith(towel));
  // const hasNoPotentialSolution = !hasTowelMatchingStart || !hasTowelMatchingEnd;

  // if (hasNoPotentialSolution) {
  //   return false;
  // }

  for (const towel of towels) {
    if (fromStart ? design.startsWith(towel) : design.endsWith(towel)) {
      // Possible -> now search the rest of the design
      // console.log(design, "Start with", towel);

      // Nicely for me string.replace only replaces the first instance IF the match is a string
      const truncatedDesign = fromStart
        ? design.replace(towel, "")
        : design.replace(new RegExp(towel + "$"), "");
      // console.log("Truncated to", truncatedDesign);
      if (isDesignPossible(truncatedDesign, towels, cache, !fromStart)) {
        cache.add(truncatedDesign);
        return true;
      }
    }
  }

  return false;
}

function findPossibleDesigns(designs: Design[], towels: Towel[]) {
  const combinationCache = new Set<string>(towels);

  return designs.filter((design) => {
    const possible = isDesignPossible(design, towels, combinationCache, true);
    console.log("Design", possible ? "Possible" : "Impossible", design);
    return possible;
  });
}

function findAllTowelCombindationsForDesign(
  design: Design,
  towels: Towel[],
  combinationsCache: Map<Design, number>
): number {
  // Here we know the design is possible - so we just need to add things up

  if (combinationsCache.has(design)) {
    return combinationsCache.get(design)!;
  }

  let totalCombinations = 0;

  for (const towel of towels) {
    let numCombinations = 0;
    // console.log("Towel", towel);

    if (design.startsWith(towel)) {
      numCombinations = numCombinations + 1;
      const truncatedDesign = design.replace(towel, "");
      // console.log("truncated design", truncatedDesign);
      if (truncatedDesign === "") {
        // do nothing
      } else {
        const combinations = findAllTowelCombindationsForDesign(
          truncatedDesign,
          towels,
          combinationsCache
        );

        numCombinations = numCombinations * combinations;
        combinationsCache.set(truncatedDesign, numCombinations);
      }

      totalCombinations = totalCombinations + numCombinations;
      // console.log("design and combos", design, totalCombinations);
    }
  }

  return totalCombinations;
}

function sumTotalCombinations(possibleDesigns: Design[], towels: Towel[]) {
  const combinationCache = new Map();

  return possibleDesigns.reduce((acc, nextDesign) => {
    console.log("Combos for ", nextDesign);
    const combos = findAllTowelCombindationsForDesign(
      nextDesign,
      towels,
      combinationCache
    );
    console.log(combos);
    return acc + combos;
  }, 0);
}

function parts() {
  console.log("Part 1");
  const { towels, designs } = parseInput();
  console.log(towels, designs);
  const possibleDesigns = findPossibleDesigns(designs, towels);
  console.log("Possible designs =", possibleDesigns.length);

  console.log("Part 2");
  const totalCombinations = sumTotalCombinations(possibleDesigns, towels);
  console.log("Total combinations", totalCombinations);
}

parts();
