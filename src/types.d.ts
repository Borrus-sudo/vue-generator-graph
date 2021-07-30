export type findSRCType = (baseURL: string,name:string) => string[]|"404";
export type dependencyGraph = {
  bareImports: Array<{ name: string; graph: "none" }>;
  moduleImports: Array<
    | { name: string; graph: dependencyGraph }
    | { name: string; graph: "none" }
    | { name: string; graph: "circularReference" }
  >;
  baseString: string;
};
