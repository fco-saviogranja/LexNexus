"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  buildMindMapIndex,
  findAncestorBranch,
  type MindMapData,
  type MindMapNode,
  type MindMapIndex,
} from "../src/lib/mind-map";

/* ═══════════════════════════════════════════════════════════════
   Color palette — one per branch, vibrant & distinct
   ═══════════════════════════════════════════════════════════════ */
const PALETTE = [
  {
    bg: "#dbeafe",
    border: "#3b82f6",
    text: "#1e3a5f",
    accent: "#3b82f6",
    light: "#eff6ff",
  },
  {
    bg: "#dcfce7",
    border: "#22c55e",
    text: "#14532d",
    accent: "#22c55e",
    light: "#f0fdf4",
  },
  {
    bg: "#fce7f3",
    border: "#ec4899",
    text: "#831843",
    accent: "#ec4899",
    light: "#fdf2f8",
  },
  {
    bg: "#fef3c7",
    border: "#f59e0b",
    text: "#78350f",
    accent: "#f59e0b",
    light: "#fffbeb",
  },
  {
    bg: "#ede9fe",
    border: "#8b5cf6",
    text: "#3b0764",
    accent: "#8b5cf6",
    light: "#f5f3ff",
  },
  {
    bg: "#fed7aa",
    border: "#f97316",
    text: "#7c2d12",
    accent: "#f97316",
    light: "#fff7ed",
  },
  {
    bg: "#cffafe",
    border: "#06b6d4",
    text: "#164e63",
    accent: "#06b6d4",
    light: "#ecfeff",
  },
  {
    bg: "#fecdd3",
    border: "#f43f5e",
    text: "#881337",
    accent: "#f43f5e",
    light: "#fff1f2",
  },
  {
    bg: "#d1fae5",
    border: "#10b981",
    text: "#064e3b",
    accent: "#10b981",
    light: "#ecfdf5",
  },
] as const;

type PaletteEntry = (typeof PALETTE)[number];

/* ═══════════════════════════════════════════════════════════════
   Canvas constants
   ═══════════════════════════════════════════════════════════════ */
const CW = 1800;
const CH = 1500;
const CX = CW / 2;
const CY = CH / 2;
const RADIUS = 440;
const CENTER_W = 320;
const CENTER_H = 120;
const BRANCH_W = 240;

/* ═══════════════════════════════════════════════════════════════
   Layout & helpers
   ═══════════════════════════════════════════════════════════════ */
type BranchLayout = {
  id: string;
  x: number;
  y: number;
  angle: number;
  node: MindMapNode;
  color: PaletteEntry;
  childCount: number;
};

function computeBranches(index: MindMapIndex): BranchLayout[] {
  return index.primaryBranches.map((branch, i) => {
    const angle =
      (i / index.primaryBranches.length) * 2 * Math.PI - Math.PI / 2;
    return {
      id: branch.id,
      x: CX + RADIUS * Math.cos(angle),
      y: CY + RADIUS * Math.sin(angle),
      angle,
      node: branch,
      color: PALETTE[i % PALETTE.length],
      childCount: (index.childrenByParentId[branch.id] ?? []).length,
    };
  });
}

function connectionPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M${x1},${y1} C${x1 + dx * 0.35},${y1 + dy * 0.08} ${x2 - dx * 0.35},${y2 - dy * 0.08} ${x2},${y2}`;
}

function branchEmoji(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("constituição") || l.includes("constituicao")) return "⚖️";
  if (l.includes("direitos")) return "🛡️";
  if (l.includes("remédios") || l.includes("remedios")) return "💊";
  if (l.includes("controle")) return "🎯";
  if (l.includes("estado")) return "🏛️";
  if (l.includes("poderes")) return "⚔️";
  if (l.includes("legislativo")) return "📜";
  if (l.includes("justiça") || l.includes("justica")) return "⚡";
  if (l.includes("social") || l.includes("ordem")) return "🌍";
  return "📘";
}

function priorityBadge(p: string): string {
  if (p === "alta") return "🔥 Alta";
  if (p === "media") return "📌 Média";
  return "📎 Baixa";
}

type MindMapViewerProps = {
  map: MindMapData;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */
export function MindMapViewer({
  map,
  selectedNodeId,
  onSelectNode,
}: MindMapViewerProps) {
  const index = useMemo(() => buildMindMapIndex(map), [map]);
  const branches = useMemo(() => computeBranches(index), [index]);

  // Resolve selected branch from parent prop
  const activeBranchFromProp = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = index.nodesById[selectedNodeId];
    if (!node) return null;
    if (node.layer === "block")
      return branches.find((b) => b.id === node.id) ?? null;
    const ancestor = findAncestorBranch(selectedNodeId, index);
    return ancestor
      ? (branches.find((b) => b.id === ancestor.id) ?? null)
      : null;
  }, [selectedNodeId, index, branches]);

  const [selectedBranch, setSelectedBranch] = useState<BranchLayout | null>(
    activeBranchFromProp,
  );
  const [sidebarTopic, setSidebarTopic] = useState<MindMapNode | null>(null);

  // Zoom/pan state
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.55 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    viewX: 0,
    viewY: 0,
    moved: false,
  });

  // Fit to view
  const fitToView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = rect.width / CW;
    const sy = rect.height / CH;
    const s = Math.min(sx, sy) * 0.88;
    setView({
      scale: s,
      x: (rect.width - CW * s) / 2,
      y: (rect.height - CH * s) / 2,
    });
  }, []);

  useEffect(() => {
    fitToView();
  }, [fitToView]);

  // Sync selection from parent
  useEffect(() => {
    setSelectedBranch(activeBranchFromProp);
    if (activeBranchFromProp && selectedNodeId) {
      const node = index.nodesById[selectedNodeId];
      if (node && node.layer === "topic") setSidebarTopic(node);
      else setSidebarTopic(null);
    }
  }, [activeBranchFromProp, selectedNodeId, index]);

  // Mouse wheel zoom (centered on cursor)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((prev) => {
        const ns = Math.max(
          0.18,
          Math.min(2.5, prev.scale * (e.deltaY < 0 ? 1.1 : 0.91)),
        );
        const r = ns / prev.scale;
        return {
          scale: ns,
          x: mx - r * (mx - prev.x),
          y: my - r * (my - prev.y),
        };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Pointer drag / pan
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const v = viewRef.current;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      viewX: v.x,
      viewY: v.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    if (d.moved)
      setView((prev) => ({ ...prev, x: d.viewX + dx, y: d.viewY + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  // Click branch on the map
  const handleBranchClick = useCallback(
    (bl: BranchLayout) => {
      if (dragRef.current.moved) return;
      const toggling = selectedBranch?.id === bl.id;
      setSelectedBranch(toggling ? null : bl);
      setSidebarTopic(null);
      onSelectNode(bl.id);
    },
    [selectedBranch, onSelectNode],
  );

  // Click topic in sidebar
  const handleTopicClick = useCallback(
    (topic: MindMapNode) => {
      setSidebarTopic((prev) => (prev?.id === topic.id ? null : topic));
      onSelectNode(topic.id);
    },
    [onSelectNode],
  );

  const closeSidebar = useCallback(() => {
    setSelectedBranch(null);
    setSidebarTopic(null);
  }, []);

  // Escape key closes sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeSidebar]);

  // Derived values for sidebar
  const definitionNode = sidebarTopic ?? selectedBranch?.node ?? null;
  const definitionColor = selectedBranch?.color ?? PALETTE[0];
  const subtopics = selectedBranch
    ? (index.childrenByParentId[selectedBranch.id] ?? [])
    : [];
  const relatedNodes = definitionNode
    ? definitionNode.relatedNodeIds
        .map((id) => index.nodesById[id])
        .filter((n): n is MindMapNode => Boolean(n))
    : [];

  return (
    <div
      className="flex w-full rounded-2xl overflow-hidden border border-gray-200/70 bg-gradient-to-br from-amber-50/60 via-white to-blue-50/40"
      style={{ minHeight: 550, height: "calc(100vh - 260px)" }}
    >
      {/* ═══ Map Canvas ═══ */}
      <div
        className="relative flex-1 overflow-hidden select-none"
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          cursor:
            dragRef.current.active && dragRef.current.moved
              ? "grabbing"
              : "grab",
        }}
      >
        {/* Zoom controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() =>
              setView((p) => ({ ...p, scale: Math.min(2.5, p.scale * 1.25) }))
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 border border-gray-200 text-gray-600 font-bold text-lg shadow-sm hover:bg-gray-50 transition"
          >
            +
          </button>
          <button
            type="button"
            onClick={() =>
              setView((p) => ({ ...p, scale: Math.max(0.18, p.scale * 0.8) }))
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 border border-gray-200 text-gray-600 font-bold text-lg shadow-sm hover:bg-gray-50 transition"
          >
            −
          </button>
          <button
            type="button"
            onClick={fitToView}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 border border-gray-200 text-gray-500 text-sm shadow-sm hover:bg-gray-50 transition"
            title="Ajustar visão"
          >
            ⟳
          </button>
        </div>

        {/* Hint */}
        {!selectedBranch && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-white/85 border border-gray-200 text-xs text-gray-500 shadow-sm backdrop-blur-sm pointer-events-none">
            Clique em um ramo para explorar tópicos e definições
          </div>
        )}

        {/* Zoomable / pannable canvas */}
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
            width: CW,
            height: CH,
            position: "relative",
          }}
        >
          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CW}
            height={CH}
          >
            {/* Decorative radial rings */}
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS * 0.45}
              fill="none"
              stroke="rgba(0,0,0,0.03)"
              strokeWidth={1}
            />
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS * 0.75}
              fill="none"
              stroke="rgba(0,0,0,0.025)"
              strokeWidth={1}
            />
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke="rgba(0,0,0,0.02)"
              strokeWidth={1}
              strokeDasharray="6 6"
            />

            {branches.map((bl) => {
              const isActive = selectedBranch?.id === bl.id;
              const hasSel = Boolean(selectedBranch);
              return (
                <path
                  key={`line-${bl.id}`}
                  d={connectionPath(CX, CY, bl.x, bl.y)}
                  stroke={bl.color.accent}
                  strokeWidth={isActive ? 4.5 : 3}
                  fill="none"
                  opacity={hasSel ? (isActive ? 0.7 : 0.12) : 0.4}
                  strokeLinecap="round"
                  style={{ transition: "all 0.5s ease" }}
                />
              );
            })}
          </svg>

          {/* Center node */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: CX - CENTER_W / 2,
              top: CY - CENTER_H / 2,
              width: CENTER_W,
              height: CENTER_H,
            }}
          >
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-2xl flex flex-col items-center justify-center text-center px-5 border-2 border-slate-600/20">
              <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                {map.meta.renderHints?.centerLabel ?? map.meta.title}
              </h1>
              {map.meta.renderHints?.centerSuffix && (
                <span className="mt-1.5 inline-block px-4 py-1 rounded-full bg-amber-400/90 text-sm font-bold text-slate-900">
                  {map.meta.renderHints.centerSuffix}
                </span>
              )}
            </div>
          </div>

          {/* Branch nodes */}
          {branches.map((bl) => {
            const isSelected = selectedBranch?.id === bl.id;
            const dimmed = Boolean(selectedBranch) && !isSelected;
            return (
              <div
                key={bl.id}
                className="absolute"
                style={{
                  left: bl.x - BRANCH_W / 2,
                  top: bl.y - 54,
                  width: BRANCH_W,
                  opacity: dimmed ? 0.3 : 1,
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                  zIndex: isSelected ? 10 : 1,
                  transition: "all 0.4s ease",
                }}
                onClick={() => handleBranchClick(bl)}
              >
                <div
                  className="rounded-2xl overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    borderColor: bl.color.accent,
                    boxShadow: isSelected
                      ? `0 0 0 4px ${bl.color.accent}30, 0 10px 30px ${bl.color.accent}20`
                      : undefined,
                  }}
                >
                  {/* Card header */}
                  <div
                    className="px-3.5 py-2 flex items-center gap-2"
                    style={{ backgroundColor: bl.color.accent }}
                  >
                    <span className="text-base">
                      {branchEmoji(bl.node.label)}
                    </span>
                    <span className="text-[13px] font-bold text-white truncate flex-1">
                      {bl.node.label}
                    </span>
                    <span className="text-[10px] font-bold text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full shrink-0">
                      {bl.childCount}
                    </span>
                  </div>
                  {/* Card body */}
                  <div className="px-3.5 py-2.5 bg-white">
                    <p
                      className="text-[11px] text-gray-600 leading-relaxed"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {bl.node.summary}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: bl.color.light,
                          color: bl.color.text,
                        }}
                      >
                        {priorityBadge(bl.node.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Sidebar — Definition & Topics ═══ */}
      {selectedBranch && (
        <aside
          className="w-[380px] border-l border-gray-200 bg-white overflow-y-auto flex flex-col shrink-0"
          style={{ animation: "slideInRight 0.25s ease-out" }}
        >
          {/* Branch header */}
          <div
            className="px-5 pt-5 pb-4 border-b-2"
            style={{ borderColor: definitionColor.accent }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white"
                  style={{ backgroundColor: definitionColor.accent }}
                >
                  {branchEmoji(selectedBranch.node.label)}{" "}
                  {selectedBranch.node.label}
                </span>
                {sidebarTopic && (
                  <p
                    className="mt-3 text-lg font-bold leading-tight"
                    style={{ color: definitionColor.text }}
                  >
                    {sidebarTopic.label}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 transition"
              >
                ×
              </button>
            </div>
          </div>

          {/* Definition section */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              📖 Definição
            </h3>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              {definitionNode?.summary ??
                "Selecione um tópico para ver a definição."}
            </p>

            {definitionNode && definitionNode.keyReferences.length > 0 && (
              <div className="mt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  📌 Referências
                </h4>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {definitionNode.keyReferences.map((ref) => (
                    <span
                      key={ref}
                      className="px-2.5 py-1 text-xs font-medium rounded-full border"
                      style={{
                        backgroundColor: definitionColor.light,
                        color: definitionColor.text,
                        borderColor: definitionColor.border + "30",
                      }}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {definitionNode && (
              <div className="mt-3">
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      definitionNode.priority === "alta"
                        ? "#fef3c7"
                        : definitionNode.priority === "media"
                          ? "#e0e7ff"
                          : "#f1f5f9",
                    color:
                      definitionNode.priority === "alta"
                        ? "#92400e"
                        : definitionNode.priority === "media"
                          ? "#3730a3"
                          : "#475569",
                  }}
                >
                  {priorityBadge(definitionNode.priority)}
                </span>
              </div>
            )}

            {relatedNodes.length > 0 && (
              <div className="mt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  🔗 Conexões
                </h4>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {relatedNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        const targetBranch = branches.find((b) => {
                          const ancestor = findAncestorBranch(node.id, index);
                          return ancestor?.id === b.id || b.id === node.id;
                        });
                        if (targetBranch) {
                          setSelectedBranch(targetBranch);
                          if (node.layer === "topic") setSidebarTopic(node);
                          else setSidebarTopic(null);
                        }
                        onSelectNode(node.id);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-full border transition hover:shadow-sm"
                      style={{
                        backgroundColor: definitionColor.light,
                        color: definitionColor.text,
                        borderColor: definitionColor.border + "30",
                      }}
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sidebarTopic && (
              <button
                type="button"
                onClick={() => {
                  setSidebarTopic(null);
                  onSelectNode(selectedBranch.id);
                }}
                className="mt-3 text-sm font-medium flex items-center gap-1 transition hover:opacity-80"
                style={{ color: definitionColor.accent }}
              >
                ← Voltar para visão do ramo
              </button>
            )}
          </div>

          {/* Subtopics list */}
          <div className="px-5 py-4 flex-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              📚 Tópicos ({subtopics.length})
            </h3>
            <div className="mt-3 space-y-2">
              {subtopics.map((topic, i) => {
                const isActive = sidebarTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicClick(topic)}
                    className="w-full text-left p-3 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: isActive
                        ? definitionColor.accent
                        : "rgb(229 231 235)",
                      backgroundColor: isActive
                        ? definitionColor.light
                        : "#fafafa",
                      boxShadow: isActive
                        ? `0 4px 12px ${definitionColor.accent}15`
                        : "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="text-sm font-semibold flex-1"
                        style={{
                          color: isActive ? definitionColor.text : "#374151",
                        }}
                      >
                        {topic.label}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: definitionColor.bg,
                          color: definitionColor.text,
                        }}
                      >
                        {topic.priority}
                      </span>
                    </div>
                    {isActive && (
                      <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                        {topic.summary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* Keyframes for sidebar animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
