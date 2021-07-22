import { PathLike } from "fs";

export type findSRCType = (baseURL: string) => string;
export type dependencyGraph = {
  bareImports: Array<{ name: string; graph: "none" }>;
  moduleImports: Array<
    | { name: string; graph: dependencyGraph }
    | { name: string; graph: "none";}
    | { name: string; graph: "circularReference";}
  >;
  baseString: PathLike;
};
