import { dependencyGraph } from "./types";

export default function (
  viewGraphs: Array<{
    name: string;
    graph: "none" | dependencyGraph;
  }>
): string[] {
  const createNodeGraph = (node: {
    name: string;
    graph: dependencyGraph | "none" | "circularReference";
  }): string => {
    let currentScript: string = ``;
    let start: string = "(";
    let end: string = ")";
    if (
      node.name.includes("store") ||
      (node.graph !== "none" &&
        node.graph !== "circularReference" &&
        node.graph.baseString.includes("store"))
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
      node.name = node.name.includes("pages")
        ? node.name.split("pages\\")[1]
        : node.name.includes("views")
        ? node.name.split("views\\")[1]
        : node.name;
    }
    if (node.graph != "circularReference" && node.graph != "none") {
      for (let modulePkg of node.graph.moduleImports) {
        currentScript += `\t ${node.name}-->${modulePkg.name} \n`;
        const result = createNodeGraph(modulePkg).split("\n");
        for (let content of result) {
          if (!currentScript.includes(content)) {
            currentScript += `${content} \n`;
          }
        }
      }
    }
    currentScript += `\t ${node.name}${start}${node.name}${end} \n`;
    currentScript += `\t click ${node.name} call openFile(); \n`;
    return currentScript;
  };
  const mds: string[] = [];
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph LR \n` + createNodeGraph(viewGraph);
    mds.push(mermaidMD);
  }
  console.log(mds[2]);
  return mds;
}
