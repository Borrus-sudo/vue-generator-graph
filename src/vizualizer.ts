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
      node.name === "store" ||
      node.name === "store.ts" ||
      node.name === "store.js"
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

    if (node.graph != "circularReference" && node.graph != "none") {
      for (let module of node.graph.moduleImports) {
        currentScript += `\t ${node.name}-->${module.name} \n`;
        currentScript += createNodeGraph(module);
      }
      // currentScript += `\t ${node.name}${start}"${node.name}<br> ${
      //   node.name != "App.vue"
      //     ? "<u>BareImports</u> <br>"
      //     : "<u>Plugins</u> <br>"
      // }${[...new Set(node.graph.bareImports.map((elem) => elem.name))].join(
      //   "<br>"
      // )}"${end} \n`;

    }
    // else {
    currentScript += `\t ${node.name}${start}${node.name}${end} \n`;
    // }
    return currentScript;
  };
  const mds: string[] = [];
  for (const viewGraph of viewGraphs) {
    const mermaidMD = `graph LR \n` + createNodeGraph(viewGraph);
    mermaidMD != `graph LR \n`
      ? mds.push(mermaidMD)
      : mds.push(mermaidMD + `\t ${viewGraph.name}`);
  }
  console.log(mds[0]);

  return mds;
}
