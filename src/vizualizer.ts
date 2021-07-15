import { dependencyGraph } from "./types";
/*@ts-ignore */
import html from "./web/index.html";
export default async function visualize(
  viewGraphs: Array<dependencyGraph>
): Promise<string> {
  for (const viewGraph of viewGraphs) {
    console.log(viewGraph);
  }
  // const htmlCode: string = fs.readFileSync("./webview/index.html", { encoding: "utf-8" });
  return html;
}
