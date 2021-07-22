import * as fs from "fs";
import * as path from "path";
import * as Jtype from "./types";
import * as lexer from "es-module-lexer";
import { parse } from "node-html-parser";
import { paramCase } from "change-case";
import getComponents from "./revealComponents";
//Find all the files from a given directory with search for nested folders
const flattenDirectory = (dir: string): string[] => {
  const contents: string[] = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
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

//Resolve a dependency path
const pathResolve = (dir: string, payloadDir: string): string => {
  dir = !(dir.startsWith("@/") || dir.startsWith("~/"))
    ? path.resolve(payloadDir, dir)
    : dir
        .split("/")
        .map((char) => (char === "@" ? rootSRC : char))
        .join(path.sep);
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    const contents: string[] = fs.readdirSync(dir);
    loop: for (let content of contents) {
      const { name, base } = path.parse(content);
      if (name === "index") {
        dir = path.join(dir, base);
        break loop;
      }
    }
  }
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
  const parsedCode = parse(sfcCode, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      script: true,
      template: true,
    },
  });
  const scriptCode = parsedCode?.querySelector("script")?.innerText.trim();

  const vueCode: string =
    scriptCode ||
    (ext === ".js" || ext === ".ts" ? sfcCode : "const noImports='doofus'");
  const statements: lexer.ImportSpecifier[] = [];
  const { 0: importStatements } = lexer.parse(vueCode);
  statements.push(...importStatements);
  const componentDir = path.join(rootSRC, "components");
  if (ext === ".vue" && fs.existsSync(componentDir)) {
    const templateCode: string =
      parsedCode.querySelector("template")?.innerHTML.trim() || "";
    const components = getComponents(templateCode);
    const contents: string[] = flattenDirectory(componentDir);
    if (components.length > 0 && contents.length > 0)
      for (let content of contents) {
        const { name } = path.parse(content ? content : "");
        if (
          name &&
          (components.includes(name) || components.includes(paramCase(name)))
        ) {
          let isPresent = false;
          statements.forEach((element) => {
            const elemName = path.parse(element.n || "").name || "";
            if (elemName === name) {
              isPresent = true;
            }
          });
          if (!isPresent) {
            //Only n is required hence the other are given default random values
            statements.push({
              d: 0,
              e: 0,
              n: content,
              s: 0,
              se: 0,
              ss: 0,
            });
          }
        }
      }
  }
  return statements.length > 0 ? statements : undefined;
};

//Get the imports from a file and crawl it to get imports and form a dependency graph of the view
const crawlViewDecorator = (): [Function, Function] => {
  const cache = new Map();
  const trail: string[] = [];
  const crawlView = async (
    baseString: string
  ): Promise<Jtype.dependencyGraph | undefined> => {
    if (
      baseString.endsWith("router" + path.sep + "index.ts") ||
      baseString.endsWith("router" + path.sep + "index.js")
    ) {
      return undefined;
    }
    const returnVal = cache.get(baseString);
    if (returnVal) {
      return returnVal;
    } else {
      const dependencies = await extractImports(baseString);

      const dependencyGraph: Jtype.dependencyGraph = {
        bareImports: [],
        moduleImports: [],
        baseString,
      };
      const { dir: payloadDir, base: payloadBase } = path.parse(baseString);
      trail.push(payloadBase);
      if (dependencies) {
        for (let dependency of dependencies) {
          trail.splice(trail.indexOf(payloadBase) + 1);
          let subDependencyGraph: Jtype.dependencyGraph | undefined;
          if (dependency.n) {
            const dependencyPath = pathResolve(dependency.n, payloadDir);
            let { base, dir } = path.parse(dependencyPath);
            if (
              !(
                dependency.n.startsWith("./") ||
                dependency.n.startsWith("../") ||
                dependency.n.startsWith("@/") ||
                dependency.n.startsWith("~/") ||
                fs.existsSync(dependency.n)
              )
            ) {
              const parts = dir.split(path.sep);
              if (parts[parts.length - 1].startsWith("@")) {
                base = parts[parts.length - 1] + "/" + base;
              }
              dependencyGraph.bareImports.push({
                name: base,
                graph: "none",
              });
            } else {
              if (!trail.includes(base)) {
                subDependencyGraph = await crawlView(dependencyPath);
                if (subDependencyGraph) {
                  dependencyGraph.moduleImports.push({
                    name: base,
                    graph: subDependencyGraph,
                  });
                } else {
                  dependencyGraph.moduleImports.push({
                    name: base,
                    graph: "none",
                  });
                }
              } else {
                dependencyGraph.moduleImports.push({
                  name: base,
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
export default async function (
  directory: string
): Promise<
  { name: string; graph: Jtype.dependencyGraph | "none" }[] | undefined
> {
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
    graph: Jtype.dependencyGraph | "none";
    baseString: fs.PathLike;
  }> = [];
  await lexer.init;
  const [crawler, resetTrail] = crawlViewDecorator();
  views.push(path.resolve(src, "./App.vue"));

  for (let view of views) {
    const ast: Jtype.dependencyGraph | undefined = await crawler(view);
    viewGraphs.push({
      name: view.split(src + "\\")[1],
      graph: ast ? ast : "none",
      baseString: view,
    });
    resetTrail();
  }
  console.log(viewGraphs);

  return viewGraphs;
}
