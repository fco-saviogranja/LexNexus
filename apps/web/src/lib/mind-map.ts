export type MindMapPriority = "alta" | "media" | "baixa";
export type MindMapLayer = "root" | "block" | "topic" | "microtopic";

export type MindMapNode = {
  id: string;
  parentId: string | null;
  order: number;
  label: string;
  layer: MindMapLayer;
  priority: MindMapPriority;
  summary: string;
  keyReferences: string[];
  relatedNodeIds: string[];
};

export type MindMapData = {
  meta: {
    id: string;
    title: string;
    discipline: string;
    examTrack: string;
    version: number;
    language: string;
    rootNodeId: string;
    sourceProfile: Array<{
      role: string;
      file: string;
    }>;
    studyPriority: string[];
    renderHints?: {
      centerLabel?: string;
      centerSuffix?: string;
      primaryBranches?: number;
      emphasisNodeIds?: string[];
    };
  };
  nodes: MindMapNode[];
};

export type MindMapIndex = {
  root: MindMapNode;
  nodesById: Record<string, MindMapNode>;
  childrenByParentId: Record<string, MindMapNode[]>;
  primaryBranches: MindMapNode[];
};

export function buildMindMapIndex(map: MindMapData): MindMapIndex {
  const nodesById = Object.fromEntries(map.nodes.map((node) => [node.id, node]));
  const root = nodesById[map.meta.rootNodeId];

  if (!root) {
    throw new Error(`Root node ${map.meta.rootNodeId} not found in mind map ${map.meta.id}`);
  }

  const childrenByParentId = map.nodes.reduce<Record<string, MindMapNode[]>>((acc, node) => {
    if (!node.parentId) {
      return acc;
    }

    acc[node.parentId] ??= [];
    acc[node.parentId].push(node);
    return acc;
  }, {});

  for (const nodes of Object.values(childrenByParentId)) {
    nodes.sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
  }

  const primaryBranches = (childrenByParentId[root.id] ?? []).slice().sort((left, right) => {
    const leftPriority = map.meta.studyPriority.indexOf(left.id);
    const rightPriority = map.meta.studyPriority.indexOf(right.id);

    if (leftPriority !== -1 || rightPriority !== -1) {
      return (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority) - (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority);
    }

    return left.order - right.order;
  });

  return {
    root,
    nodesById,
    childrenByParentId,
    primaryBranches
  };
}

export function findAncestorBranch(nodeId: string, index: MindMapIndex): MindMapNode | null {
  let current = index.nodesById[nodeId];

  while (current?.parentId) {
    const parent = index.nodesById[current.parentId];
    if (!parent) {
      return null;
    }
    if (parent.layer === "block") {
      return parent;
    }
    current = parent;
  }

  return current?.layer === "block" ? current : null;
}
