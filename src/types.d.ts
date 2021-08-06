export type findSRCType = (baseURL: string, name: string) => string[] | "404";
export type dependencyGraph = {
  bareImports: Array<{ name: string; graph: "none" }>;
  moduleImports: Array<
    | { name: string; graph: dependencyGraph; baseString: string }
    | { name: string; graph: "none"; baseString: string }
    | { name: string; graph: "circularReference"; baseString: string }
  >;
};
export type node = {
  name: string;
  graph: dependencyGraph | "none" | "circularReference";
  baseString: string;
};
