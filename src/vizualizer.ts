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
    }

    if (node.graph != "circularReference" && node.graph != "none") {
      for (let module of node.graph.moduleImports) {
        currentScript += `\t ${node.name}-->${module.name} \n`;
        const result = createNodeGraph(module).split("\n");
        for (let content of result) {
          if (!currentScript.includes(content)) {
            currentScript += `${content} \n`;
          }
        }
      }
      // currentScript += `\t ${node.name}${start}"${node.name}<br> ${
      //   node.name != "App.vue"
      //     ? "<u>BareImports</u> <br>"
      //     : "<u>Plugins</u> <br>"
      // }${[...new Set(node.graph.bareImports.map((elem) => elem.name))].join(
      //   "<br>"
      // )}"${end} \n`;
      if (node.graph.baseString) {
        // currentScript += `\t click ${node.name} callback "Tool tip" \n`;
      }
    }
    currentScript += `\t ${node.name}${start}${node.name}${end} \n`;

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
