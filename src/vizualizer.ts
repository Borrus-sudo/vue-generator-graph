import { dependencyGraph } from "./types";

export default async function visualize(
  viewGraphs: Array<dependencyGraph> | undefined
): Promise<void> {
  console.log({ viewGraphs });

  return;
}
