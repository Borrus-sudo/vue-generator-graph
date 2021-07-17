import * as fs from "fs";
import * as path from "path";
import * as Jtype from "./types";
import * as lexer from "es-module-lexer";
import { parse } from "node-html-parser";

//Find the source folder
let rootSRC: string = "";
const findSRC: Jtype.findSRCType = (baseURL: string): string => {
  let search = "";
  const directories = fs
    .readdirSync(baseURL)
    .filter((elem) => !elem.startsWith("."));
  loop: for (let directory of directories) {
    if (fs.statSync(path.join(baseURL, directory)).isDirectory()) {
      if (directory !== "node_modules")
        if (directory === "src") {
          search = path.join(baseURL, directory);
          break loop;
        } else {
          const isSRC: string = findSRC(path.join(baseURL, directory));
          if (isSRC !== "404") {
            search = isSRC;
            break loop;
          }
        }
    }
  }

  if (search) return search;
  else return "404";
};
const pathResolve = (dir: string): string => {
  const mainDetails = path.parse(dir);
  let result: string = "";
  if (!mainDetails.ext && fs.existsSync(mainDetails.dir)) {
    const contents = fs.readdirSync(mainDetails.dir);
    for (let content of contents) {
      const contentDetails = path.parse(path.join(mainDetails.dir, content));
      if (contentDetails.name === mainDetails.name) {
        result = dir + contentDetails.ext;
      }
    }
  }
  result = result ? result : dir;
  return result;
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
  const ext = path.parse(directory).ext;
  const code = parse(sfcCode, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      script: true,
    },
  })
    ?.querySelector("script")
    ?.innerText.trim();

  const vueCode: string =
    code ||
    (ext === ".js" || ext === ".ts" ? sfcCode : "const noImports='doofus'");
  const { 0: importStatements } = lexer.parse(vueCode);

  return importStatements.length > 0 ? importStatements : undefined;
};

//Get the imports from a file and crawl it to get imports and form a dependency graph of the view
const crawlViewDecorator = (): [Function, Function] => {
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
          let subDependencyGraph: Jtype.dependencyGraph | undefined;
          if (dependency.n) {
            const dependencyPath = pathResolve(
              !dependency.n.startsWith("@")
                ? path.resolve(payloadDir, dependency.n)
                : dependency.n
                    .split("/")
                    .map((char) => (char === "@" ? rootSRC : char))
                    .join(path.sep)
            );
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
                  graph: "circularReference",
                });
              }
            }
          }
        }
      } else {
        cache.set(baseString, "none");
        return undefined;
      }
      return dependencyGraph;
    }
  };
  const resetTrail = () => {
    if (trail.length > 0) trail.splice(0, trail.length);
  };
  return [crawlView, resetTrail];
};
//Function to put all the pieces together
const flattenDirectory = (dir: string): string[] => {
  const contents: string[] = fs.readdirSync(dir);
  const result: string[] = [];
  for (let content of contents) {
    const contentPath = path.join(dir, content);
    if (fs.statSync(contentPath).isFile()) {
      result.push(contentPath);
    } else {
      result.push(...flattenDirectory(contentPath));
    }
  }
  return result;
};
export default async function parser(
  directory: string
): Promise<{ name: string; graph: Jtype.dependencyGraph }[] | undefined> {
  let src: string = findSRC(directory);
  rootSRC = src;
  if (src === "404") {
    return;
  }
  const slug = fs.existsSync(path.join(src, "views"))
    ? path.join(src, "views")
    : fs.existsSync(path.join(src, "pages"))
    ? path.join(src, "pages")
    : "";

  const views = flattenDirectory(slug);

  const viewGraphs: Array<{
    name: string;
    graph: Jtype.dependencyGraph;
  }> = [];
  await lexer.init;
  const [crawler, resetTrail] = crawlViewDecorator();
  for (let view of views) {
    const ast: Jtype.dependencyGraph | undefined = await crawler(view);

    if (ast) {
      viewGraphs.push({
        name: view.split(slug + "\\")[1],
        graph: ast,
      });
    }
    resetTrail();
  }
  console.log(viewGraphs);

  return viewGraphs;
}
