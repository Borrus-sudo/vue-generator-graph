import * as fs from "fs";
import * as path from "path";
import * as Jtype from "./types";
import * as lexer from "es-module-lexer";
import * as vscode from "vscode";
import { parse } from "node-html-parser";
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
  if (!fs.existsSync(directory)) return undefined;
  const sfcCode: string = fs.readFileSync(directory, {
    encoding: "utf-8",
  });
  const vueCode: string =
    parse(sfcCode, {
      lowerCaseTagName: false,
      comment: false,
      blockTextElements: {
        script: true,
      },
    })
      ?.querySelector("script")
      ?.innerText.trim() ?? "const noImportsDoofus='brhhhhhhhhh'";
  const { 0: importStatements } = lexer.parse(vueCode);
  return importStatements.length > 0 ? importStatements : undefined;
};

//Get the imports from a file and crawl it to get imports and form a dependency graph of the view
const crawlView = async (
  baseString: string
): Promise<Jtype.dependencyGraph | undefined> => {
  const dependencies = await extractImports(baseString);
  const dependencyGraph: Jtype.dependencyGraph = {
    bareImports: [],
    moduleImports: [],
  };
  if (dependencies)
    for (let dependency of dependencies) {
      let subDependencyGraph: Jtype.dependencyGraph | undefined;
      if (dependency.n) {
        const dependencyPath = path.resolve(
          path.parse(baseString).dir,
          dependency.n
        );
        const { name, ext } = path.parse(dependencyPath);
        if (!dependency.n.includes("/")) {
          dependencyGraph.bareImports.push({
            name: name + ext,
            graph: "none",
          });
        } else {
          //To fix dependency subDependencyGraph stuff
          subDependencyGraph = await crawlView(dependencyPath);
          if (subDependencyGraph) {
            dependencyGraph.moduleImports.push({
              name: name + ext,
              graph: subDependencyGraph,
            });
          } else {
            dependencyGraph.moduleImports.push({
              name: name + ext,
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
  const viewGraphs: Array<Jtype.dependencyGraph> = [];
  await lexer.init;
  for (let view of views) {
    console.log(view);
    const ast: Jtype.dependencyGraph | undefined = await crawlView(
      path.join(src, "views", view)
    );
    if (ast) {
      viewGraphs.push(ast);
    }
  }
  console.log(viewGraphs);
}
