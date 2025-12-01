export interface DeepSkyObject {
  id: string;
  catalogueEntry: string;
  familiarName: string;
  altNames: string[];
  type: string;
  group: string;
  constellation: string;
  ra: string;   // ex: "05h 35' 17\""
  dec: string;  // ex: "-05º 23' 24\""
  magnitude: number | null;
  size: string; // ex: "1.1º x 1.1º"
  surfaceBrightness: number | null;
  score?: number;
}

export interface DeepSkyCatalog {
  version: number;
  source: string;
  updatedAt?: string;
  objects: DeepSkyObject[];
}