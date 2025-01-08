import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, posix } from "path";
import { stdout } from "process";

type Connections = Map<string, Set<string>>;

function parseInput(): Connections {
  const input = readFileSync(join(__dirname, "input")).toString();

  const connections = new Map<string, Set<string>>();

  input.split("\n").forEach((connection) => {
    const [comp1, comp2] = connection.split("-");

    connections.set(
      comp1,
      (connections.get(comp1) ?? new Set<string>()).add(comp2)
    );
    connections.set(
      comp2,
      (connections.get(comp2) ?? new Set<string>()).add(comp1)
    );
    return { comp1, comp2 };
  });

  return connections;
}

function getConcentratedNetwork(
  networkConnections: Connections,
  computerConnections: Connections
): Connections {
  const nextConnections: Connections = new Map();
  for (const [networkKey, connectedTo] of networkConnections.entries()) {
    for (const nextComp of connectedTo.values()) {
      const nextCompConnections = computerConnections.get(nextComp)!;
      const intersection = connectedTo.intersection(nextCompConnections);

      if (intersection.size) {
        const computersAlreadyInNetwork = networkKey.split("-");
        const newKey = computersAlreadyInNetwork
          .concat([nextComp])
          .toSorted((a, b) => a.localeCompare(b))
          .join("-");
        nextConnections.set(newKey, intersection);
      }
    }
  }
  return nextConnections;
}

function getSetOfThreeInterconnectedComputers(
  connections: Connections
): Set<string> {
  const setOfConnections = new Set<string>();

  for (const [comp, connectedTo] of connections.entries()) {
    for (const secondComp of connectedTo.values()) {
      const secondCompConnections = connections.get(secondComp)!;
      const intersection = connectedTo.intersection(secondCompConnections);
      // Hoorary - the intersection is all the 3 way connected computers
      for (const thirdComp of intersection.values()) {
        const threeCompSet = [comp, secondComp, thirdComp]
          .toSorted((a, b) => {
            if (b.startsWith("t") && a.startsWith("t")) {
              return a.localeCompare(b);
            }

            if (a.startsWith("t")) {
              return -1;
            }

            if (b.startsWith("t")) {
              return 1;
            }

            return a.localeCompare(b);
          })
          .join(",");

        setOfConnections.add(threeCompSet);
      }
    }
  }

  return setOfConnections;
}

function getBiggestSetsOfInterconnectedComputers(
  connections: Connections
): string {
  let concentratedNetwork = connections;
  let previousNetwork = concentratedNetwork;

  while (concentratedNetwork.size > 0) {
    previousNetwork = concentratedNetwork;
    concentratedNetwork = getConcentratedNetwork(
      concentratedNetwork,
      connections
    );
  }

  const [firstKey, firstValue] = Array.from(previousNetwork.entries())[0];

  const network = firstKey
    .split("-")
    .concat(Array.from(firstValue))
    .toSorted((a, b) => a.localeCompare(b))
    .join(",");

  return network;
}

function countConnectionSetsThatStartWitht(connectionSet: Set<string>) {
  let count = 0;

  for (const threeCompSet of connectionSet.values()) {
    if (threeCompSet.startsWith("t")) {
      count++;
    }
  }

  return count;
}

function part1() {
  console.log("Part 1");
  const connections = parseInput();
  const threeComputerSets = getSetOfThreeInterconnectedComputers(connections);
  const totalIncludingTs = countConnectionSetsThatStartWitht(threeComputerSets);
  console.log(totalIncludingTs);
}

function part2() {
  console.log("Part 2");
  const connections = parseInput();
  const biggestSet = getBiggestSetsOfInterconnectedComputers(connections);
  console.log(biggestSet);
}

part1();
part2();
