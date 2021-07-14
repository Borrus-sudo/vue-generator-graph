import * as fs from "fs";
import * as path from "path";
import * as Jtype from "./types";
import * as lexer from "es-module-lexer";
import * as vscode from "vscode";
import { parse } from "node-html-parser";

//Find the source folder
let rootSRC: string = "";
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
const crawlViewDecorator = (): Function => {
  const cache = new Map();
  const trail: string[] = [];
  const crawlView = async (
    baseString: string
  ): Promise<Jtype.dependencyGraph | undefined> => {
    if (cache.get(baseString)) {
      return cache.get(baseString);
    } else {
      const dependencies = await extractImports(baseString);
      const dependencyGraph: Jtype.dependencyGraph = {
        bareImports: [],
        moduleImports: [],
      };
      const {
        name: payloadName,
        ext: payloadExt,
        dir: payloadDir,
      } = path.parse(baseString);
      trail.push(payloadName + payloadExt);
      if (dependencies) {
        for (let dependency of dependencies) {
          trail.splice(trail.indexOf(payloadName + payloadExt) + 1);
          console.log(trail);
          let subDependencyGraph: Jtype.dependencyGraph | undefined;
          if (dependency.n) {
            const dependencyPath = !dependency.n.startsWith("@")
              ? path.resolve(payloadDir, dependency.n)
              : dependency.n
                  .split("/")
                  .map((char) => (char === "@" ? rootSRC : char))
                  .join(path.sep);
            const { name, ext } = path.parse(dependencyPath);
            if (
              !(
                dependency.n.startsWith("./") ||
                dependency.n.startsWith("../") ||
                dependency.n.startsWith("@/")
              )
            ) {
              dependencyGraph.bareImports.push({
                name: name + ext,
                graph: "none",
              });
            } else {
              if (!trail.includes(name + ext)) {
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
              } else {
                dependencyGraph.moduleImports.push({
                  name: name + ext,
                  graph: { circularReference: "" },
                });
              }
            }
          }
        }
      } else {
        cache.set(baseString, "none");
        return undefined;
      }
      cache.set(baseString, dependencyGraph);
      return dependencyGraph;
    }
  };
  return crawlView;
};

//Function to put all the pieces together
export default async function parser(directory: string) {
  let src: string = findSRC(directory);
  rootSRC = src;
  if (src === "404") {
    vscode.window.showErrorMessage("SRC directory not found.");
    return;
  }
  const slug = fs.existsSync(path.join(src, "views"))
    ? path.join(src, "views")
    : fs.existsSync(path.join(src, "pages"))
    ? path.join(src, "pages")
    : "";
  const views = fs.readdirSync(slug);
  const viewGraphs: Array<Jtype.dependencyGraph> = [];
  await lexer.init;
  const crawler = crawlViewDecorator();
  for (let view of views) {
    console.log(view);
    const ast: Jtype.dependencyGraph | undefined = await crawler(
      path.join(slug, view)
    );
    if (ast) {
      viewGraphs.push(ast);
    }
  }
  console.log(viewGraphs);
}
