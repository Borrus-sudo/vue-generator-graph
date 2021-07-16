import { dependencyGraph } from "./types";
/*@ts-ignore */
import * as html from "./web/index.html";
export default async function visualize(
  viewGraphs: Array<dependencyGraph>
): Promise<string> {
  for (const viewGraph of viewGraphs) {
    console.log(viewGraph);
  }
  console.log(html);

  return html.default;
}
