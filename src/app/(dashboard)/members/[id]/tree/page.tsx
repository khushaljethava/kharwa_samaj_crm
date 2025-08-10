"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type FamilyMember = {
  id: string;
  personal_info?: Record<string, unknown> | null;
  member_code?: string | null;
};

type FamilyBuckets = {
  parents: FamilyMember[];
  children: FamilyMember[];
  spouses: FamilyMember[];
  siblings: FamilyMember[];
  extended_family: FamilyMember[];
  in_law: FamilyMember[];
  guardian: FamilyMember[];
};

type NodeRect = { id: string; x: number; y: number; w: number; h: number; member: FamilyMember };

export default function MemberFamilyTreePage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<FamilyBuckets | null>(null);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/members/${memberId}/family`, { cache: "no-store" });
      setLoading(false);
      if (!res.ok) {
        setError("Failed to load family");
        return;
      }
      const json = await res.json();
      if (!ignore) {
        setMember(json?.member || null);
        setFamily(json?.family || null);
      }
    }
    if (memberId) run();
    return () => {
      ignore = true;
    };
  }, [memberId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Family Tree</h1>
          <p className="text-sm text-muted-foreground">Member and relations visualized</p>
        </div>
        <Link href={`/members/${memberId}`} className="text-sm underline">Back to Member</Link>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && member && family && (
        <TreeCanvas member={member} family={family} />)
      }
    </div>
  );
}

function TreeCanvas({ member, family }: { member: FamilyMember; family: FamilyBuckets }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rects, setRects] = useState<NodeRect[]>([]);

  const nodes = useMemo(() => {
    const pi = (member.personal_info || {}) as Record<string, unknown>;
    const focusLabel = [pi.first_name as string, pi.middle_name as string, pi.last_name as string].filter(Boolean).join(" ") || "—";
    return {
      focus: { id: member.id, label: focusLabel, member },
      parents: family.parents || [],
      spouses: family.spouses || [],
      siblings: family.siblings || [],
      children: family.children || [],
      others: [
        ...(family.guardian || []).filter((x) => !family.parents?.some((p) => p.id === x.id)),
        ...(family.in_law || []),
        ...(family.extended_family || []),
      ],
    };
  }, [member, family]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const paddingY = 48;
    const nodeWidth = 160;
    const nodeHeight = 48;
    const hGap = 32;
    const vGap = 100;

    function setSize() {
      const rect = container.getBoundingClientRect();
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${Math.max(420, rect.width * 0.6)}px`;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor((Math.max(420, rect.width * 0.6)) * dpr);
    }
    setSize();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // Compute layout
    const width = canvas.width / dpr;
    const centerX = width / 2;
    const startY = paddingY;
    const levels: Array<{ key: string; items: any[]; y: number }> = [
      { key: "parents", items: nodes.parents, y: startY },
      { key: "focus", items: [nodes.focus], y: startY + vGap },
      { key: "spouses", items: nodes.spouses, y: startY + vGap },
      { key: "siblings", items: nodes.siblings, y: startY + vGap + nodeHeight + 8 },
      { key: "children", items: nodes.children, y: startY + vGap * 2 + nodeHeight },
      { key: "others", items: nodes.others, y: startY + vGap * 2 + nodeHeight + 80 },
    ];

    function xPositions(count: number, rowCenterX: number) {
      if (count <= 1) return [rowCenterX - nodeWidth / 2];
      const totalWidth = count * nodeWidth + (count - 1) * hGap;
      const startX = rowCenterX - totalWidth / 2;
      return new Array(count).fill(0).map((_, i) => startX + i * (nodeWidth + hGap));
    }

    const computedRects: NodeRect[] = [];

    // Build rects per level
    for (const level of levels) {
      const xs = xPositions(level.items.length, centerX);
      level.items.forEach((item: any, idx: number) => {
        const _label = level.key === "focus" ? (nodes.focus as any).label : displayName(item);
        const id = level.key === "focus" ? (nodes.focus as any).id : item.id;
        computedRects.push({ id, x: xs[idx], y: level.y, w: nodeWidth, h: nodeHeight, member: level.key === "focus" ? nodes.focus.member : item });
      });
    }

    // Draw helpers
    function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawNode(rect: NodeRect, highlight = false) {
      ctx.fillStyle = highlight ? "#0ea5e9" : "#111827";
      ctx.strokeStyle = highlight ? "#0284c7" : "#374151";
      ctx.lineWidth = 1.5;
      drawRoundedRect(rect.x, rect.y, rect.w, rect.h, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#111827";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system";
      ctx.textBaseline = "middle";
      ctx.save();
      const label = displayName(rect.member);
      const textX = rect.x + 10;
      const textY = rect.y + rect.h / 2;
      ctx.fillText(label, textX, textY);
      ctx.restore();
    }

    function centerOf(rect: NodeRect) {
      return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2 };
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1.25;

    const focusRect = computedRects.find((r) => r.id === nodes.focus.id)!;
    const parents = computedRects.filter((r) => family.parents.some((p) => p.id === r.id));
    const spouses = computedRects.filter((r) => family.spouses.some((p) => p.id === r.id));
    const siblings = computedRects.filter((r) => family.siblings.some((p) => p.id === r.id));
    const children = computedRects.filter((r) => family.children.some((p) => p.id === r.id));

    function connect(a: NodeRect, b: NodeRect) {
      const { cx: ax, cy: ay } = centerOf(a);
      const { cx: bx, cy: by } = centerOf(b);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    parents.forEach((p) => connect(p, focusRect));
    spouses.forEach((s) => connect(focusRect, s));
    siblings.forEach((s) => connect(focusRect, s));
    children.forEach((c) => connect(focusRect, c));

    // Draw nodes on top of edges
    computedRects.forEach((r) => drawNode(r, r.id === nodes.focus.id));

    setRects(computedRects);

    function onResize() {
      setSize();
      // redraw on next effect pass
      requestAnimationFrame(() => {
        // Trigger re-run by updating state; simplest approach is to reassign family reference via setState in parent
      });
    }

    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [nodes, family]);

  // Click navigation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (hit) {
        window.location.href = `/members/${hit.id}`;
      }
    }
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [rects]);

  const title = useMemo(() => displayName(member), [member]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Member</div>
          <div className="text-lg font-medium">{title}</div>
        </div>
      </div>
      <div ref={containerRef} className="w-full overflow-auto rounded border bg-white dark:bg-neutral-900">
        <canvas ref={canvasRef} />
      </div>
      <div className="text-xs text-muted-foreground">Tip: Click a node to open member profile</div>
    </div>
  );
}

function displayName(m: FamilyMember) {
  if (!m) return "—";
  const pi = (m.personal_info || {}) as Record<string, unknown>;
  const name = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
    .filter(Boolean)
    .join(" ");
  return name || m.member_code || m.id || "—";
}


