import { dependencyGraph } from "./types";
export default function (
  viewGraphs: Array<{
    name: string;
    graph: "none" | dependencyGraph | "circularReference";
    baseString: string;
  }>
): string[] {
  const createNodeGraph = (node: {
    name: string;
    graph: dependencyGraph | "none" | "circularReference";
    baseString: string;
  }): string => {
    let currentScript: string = ``;
    let start: string = "(";
    let end: string = ")";
    if (
      node.name.includes("store") ||
      (node.graph !== "none" &&
        node.graph !== "circularReference" &&
        node.baseString.includes("store"))
    ) {
      start = "[(";
      end = ")]";
    } else if (
      node.name.includes("pages") ||
      node.name.includes("views") ||
      node.name.includes("App.vue")
    ) {
      start = "[[";
      end = "]]";
    }
    let nodeID: string = node.baseString.replace(/\\/g, "-");
    if (node.graph != "circularReference" && node.graph != "none") {
      for (let modulePkg of node.graph.moduleImports) {
        currentScript += `\t ${nodeID}-->${modulePkg.baseString.replace(
          /\\/g,
          "-"
        )}(${modulePkg.name}) \n`;
        const result = createNodeGraph(modulePkg).split("\n");
        for (let content of result) {
          if (!currentScript.includes(content)) {
            currentScript += `${content} \n`;
          } else if (!content.includes("-->")) {
            currentScript += `${content} \n`;
          }
        }
      }
    }
    currentScript += `\t ${nodeID}${start}${node.name}${end} \n`;
    currentScript += `\t click ${nodeID} call openFile(); \n`;
    return currentScript;
  };
  const mds: string[] = [];
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph LR \n` + createNodeGraph(viewGraph);
    mds.push(mermaidMD);
  }
  console.log(mds[0]);
  return mds;
}
