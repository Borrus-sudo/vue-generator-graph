import * as fs from "fs";
import * as path from "path";
import * as Jtype from "./types";
import * as lexer from "es-module-lexer";
import * as vscode from "vscode";

//Find the source folder
const findSRC: Jtype.findSRCType = (baseURL: string): string => {
  let search = "";
  let continueSearch = true;
  const directories = fs
    .readdirSync(baseURL)
    .filter((elem) => !elem.startsWith("."));
  directories.forEach((directory) => {
    if (continueSearch) {
      if (fs.statSync(path.join(baseURL, directory)).isDirectory()) {
        if (directory !== "node_modules")
          if (directory === "src") {
            search = path.join(baseURL, directory);
            continueSearch = false;
          } else {
            const isSRC: string = findSRC(path.join(baseURL, directory));
            if (isSRC !== "404") {
              search = isSRC;
              continueSearch = false;
            }
          }
      }
    }
  });
  if (search) return search;
  else return "404";
};

//Return an array of import statements or undefined if there are none
const extractImports = async (
  directory: string
): Promise<readonly lexer.ImportSpecifier[] | undefined> => {
  await lexer.init;
  const vueCode =
    fs
      .readFileSync(directory, {
        encoding: "utf-8",
      })
      .split("<script>")?.[1]
      ?.trim()
      ?.split("</script>")[0]
      .trim() ?? "let none='NoImportWhatADoofus'";
  const { 0: importStatements } = lexer.parse(vueCode);
  return importStatements.length > 0 ? importStatements : undefined;
};

//Get the imports from a file and crawl it to get imports and form a dependency graph of the view
const crawlView = async (
  baseString: string
): Promise<Jtype.dependencyGraph | undefined> => {
  const dependencies = await extractImports(baseString);
  console.log(dependencies);
  const dependencyGraph: Jtype.dependencyGraph = {
    bareImports: [],
    moduleImports: [],
  };
  if (dependencies)
    for (let dependency of dependencies) {
      let graph: Jtype.dependencyGraph | undefined;
      if (dependency.n) {
        const dependencyPath = path.join(baseString, dependency.n);
        if (!dependency.n.includes("/")) {
          dependencyGraph.bareImports.push({
            name: path.parse(dependencyPath).name,
            graph: "none",
          });
        } else {
          graph = await crawlView(dependencyPath);
          console.log(graph);
          if (graph) {
            dependencyGraph.moduleImports.push({
              name: path.parse(dependencyPath).name,
              graph,
            });
          } else {
            dependencyGraph.moduleImports.push({
              name: path.parse(dependencyPath).name,
              graph: "none",
            });
          }
        }
      }
    }
  else {
    return undefined;
  }
  return dependencyGraph;
};

//Function to put all the pieces together
export default async function parser(directory: string) {
  let src: string = findSRC(directory);
  if (src === "404") {
    vscode.window.showErrorMessage("SRC directory not found.");
    return;
  }
  const views = fs.readdirSync(path.join(src, "views"));
  await lexer.init;
  for (let view of views) {
    console.log(view);
    console.log(await crawlView(path.join(src, "views", view)));
  }
}
