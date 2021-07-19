import { dependencyGraph } from "./types";

const createGraphs = (
  viewGraphs: Array<{
    name: string;
    graph: "none" | dependencyGraph;
  }>
): string[] => {
  const createNodeGraph = (node: {
    name: string;
    graph: dependencyGraph | "none" | "circularReference";
  }): string => {
    let currentScript = ``;
    if (node.graph != "circularReference" && node.graph != "none") {
      for (let module of node.graph.moduleImports) {
        currentScript += `\t ${node.name}-->${module.name} \n`;
        currentScript += createNodeGraph(module);
      }
      currentScript += `\t ${node.name}[${node.name}<br> ${
        node.name != "App.vue"
          ? "<u>BareImports</u> <br>"
          : "<u>Plugins</u> <br>"
      }${node.graph.bareImports.map((elem) => elem.name).join("<br>")}] \n`;
    }
    return currentScript;
  };
  const mds: string[] = [];
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph LR \n` + createNodeGraph(viewGraph);
    mermaidMD != `graph LR \n`
      ? mds.push(mermaidMD)
      : mds.push(mermaidMD + `\t ${viewGraph.name}`);
  }
  console.log(mds);

  return mds;
};
export default function visualize(
  viewGraphs: Array<{
    name: string;
    graph: dependencyGraph;
  }>
): string[] {
  return createGraphs(viewGraphs);
}
