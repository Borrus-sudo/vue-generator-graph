import { dependencyGraph } from "./types";
/*@ts-ignore */
// import * as html from "./web/index.html";

const createGraphs = async (
  viewGraphs: Array<{
    name: string;
    graph: dependencyGraph;
  }>
): Promise<string> => {
  const cache = new Map();
  const createNodeGraph = (node: {
    name: string;
    graph: dependencyGraph | "none" | "circularReference";
  }): string => {
    let currentScript = `${node.name} \n`;
    if (node.graph != "circularReference" && node.graph != "none") {
      for (let module of node.graph.moduleImports) {
        currentScript += createNodeGraph(module);
        console.log(`${node.name}-->${module.name} \n`);
        currentScript += `${node.name}-->${module.name} \n`;
      }
    }
    return currentScript;
  };
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph ` + createNodeGraph(viewGraph);
    console.log(mermaidMD);
  }
  return "";
};
export default async function visualize(
  viewGraphs: Array<{
    name: string;
    graph: dependencyGraph;
  }>
): Promise<string> {
  await createGraphs(viewGraphs);
  // console.log(html);
  return `<h1>Hello World</h1>`;
}
