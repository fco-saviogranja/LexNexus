import constitutionalOab from "../../../../docs/mind-maps/oab-direito-constitucional.json";
import type { MindMapData } from "../lib/mind-map";

const builtInMindMaps: Record<string, MindMapData> = {
  "oab-direito-constitucional": constitutionalOab as MindMapData
};

export function resolveBuiltInMindMap(version?: { fileName?: string | null; blobUrl?: string | null } | null): MindMapData | null {
  const candidates = [
    version?.fileName?.replace(/\.json$/i, ""),
    version?.blobUrl?.replace(/^\/api\/mind-maps\//, ""),
    version?.blobUrl?.replace(/^\/mind-maps\//, "").replace(/\.json$/i, "")
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (builtInMindMaps[candidate]) {
      return builtInMindMaps[candidate];
    }
  }

  return null;
}
