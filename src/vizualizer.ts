import { dependencyGraph } from "./types";
/*@ts-ignore */
// import * as html from "./web/index.html";

const createGraphs = (
  viewGraphs: Array<{
    name: string;
    graph: dependencyGraph;
  }>
): string => {
  const cache = new Map();
  const createNodeGraph = (node: {
    name: string;
    graph: dependencyGraph | "none" | "circularReference";
  }): string => {
    let currentScript = ``;
    if (node.graph != "circularReference" && node.graph != "none") {
      for (let module of node.graph.moduleImports) {
        currentScript += createNodeGraph(module);
        currentScript += `\t ${node.name}-->${module.name} \n`;
      }
    }
    return currentScript;
  };
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph TD \n` + createNodeGraph(viewGraph);
    console.log(mermaidMD);
  }
  return "";
};
export default function visualize(
  viewGraphs: Array<{
    name: string;
    graph: dependencyGraph;
  }>
): string {
  createGraphs(viewGraphs);
  // console.log(html);
  return `<h1>Hello World</h1>`;
}
