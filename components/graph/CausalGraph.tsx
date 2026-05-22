'use client';

import { useEffect, useRef, useState } from 'react';
import type { CausalEdge, CausalNode } from '@/lib/types';

interface Props {
  nodes: CausalNode[];
  edges: CausalEdge[];
  height?: number;
}

const NODE_STYLE: Record<CausalNode['kind'], { fill: string; ring: string; label: string }> = {
  user: { fill: '#0071E3', ring: 'rgba(0,113,227,0.18)', label: '用户' },
  fact: { fill: '#34C759', ring: 'rgba(52,199,89,0.18)', label: '事实' },
  skill: { fill: '#FF9F0A', ring: 'rgba(255,159,10,0.18)', label: 'Skill' },
  counterfactual: { fill: '#AF52DE', ring: 'rgba(175,82,222,0.18)', label: '反事实' },
  rule: { fill: '#1D1D1F', ring: 'rgba(0,0,0,0.10)', label: '规则' },
};

interface PositionedNode extends CausalNode {
  x: number;
  y: number;
}

export function CausalGraph({ nodes, edges, height = 480 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [positions, setPositions] = useState<PositionedNode[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(wrapperRef.current?.clientWidth ?? 900);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    // 简易力导初值：按类型分层（极简版 G6 替代），保证 SSR 无依赖。
    const layers: Record<CausalNode['kind'], CausalNode[]> = {
      user: [],
      fact: [],
      skill: [],
      counterfactual: [],
      rule: [],
    };
    nodes.forEach((n) => layers[n.kind].push(n));
    const order: CausalNode['kind'][] = ['user', 'fact', 'counterfactual', 'rule', 'skill'];
    const cols = order.filter((k) => layers[k].length);
    const colW = width / (cols.length + 1);
    const next: PositionedNode[] = [];
    cols.forEach((k, ci) => {
      const items = layers[k];
      const rowH = height / (items.length + 1);
      items.forEach((n, ri) => {
        next.push({ ...n, x: colW * (ci + 1), y: rowH * (ri + 1) });
      });
    });
    setPositions(next);
  }, [nodes, width, height]);

  const positionOf = (id: string) => positions.find((p) => p.id === id);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragId || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = Math.max(24, Math.min(width - 24, e.clientX - rect.left));
    const y = Math.max(24, Math.min(height - 24, e.clientY - rect.top));
    setPositions((prev) => prev.map((p) => (p.id === dragId ? { ...p, x, y } : p)));
  };

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height }}>
      <svg
        width="100%"
        height={height}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDragId(null)}
        onMouseLeave={() => setDragId(null)}
        className="select-none"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(120,120,128,0.55)" />
          </marker>
          <marker id="arrow-counter" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#AF52DE" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const s = positionOf(e.source);
          const t = positionOf(e.target);
          if (!s || !t) return null;
          const mx = (s.x + t.x) / 2;
          const path = `M ${s.x} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${t.x} ${t.y}`;
          const negative = (e.weight ?? 0) < 0;
          const stroke = e.counterfactual
            ? '#AF52DE'
            : negative
              ? 'rgba(255,59,48,0.55)'
              : 'rgba(120,120,128,0.55)';
          return (
            <g key={i}>
              <path
                d={path}
                stroke={stroke}
                strokeWidth={hoverEdge === i ? 2.4 : 1.4}
                strokeDasharray={e.counterfactual ? '5 4' : undefined}
                fill="none"
                markerEnd={`url(#${e.counterfactual ? 'arrow-counter' : 'arrow'})`}
                onMouseEnter={() => setHoverEdge(i)}
                onMouseLeave={() => setHoverEdge(null)}
                opacity={0.9}
              />
              {hoverEdge === i && (
                <text
                  x={mx}
                  y={(s.y + t.y) / 2 - 6}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="currentColor"
                >
                  {e.counterfactual ? '反事实链路 · ' : ''}权重 {e.weight?.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {positions.map((n) => {
          const style = NODE_STYLE[n.kind];
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onMouseDown={() => setDragId(n.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <circle r={28} fill={style.ring} />
              <circle r={18} fill={style.fill} />
              <text
                y={42}
                textAnchor="middle"
                className="text-[12px] font-medium"
                fill="currentColor"
              >
                {n.label}
              </text>
              <text
                y={-30}
                textAnchor="middle"
                className="text-[10px] uppercase tracking-[0.18em]"
                fill="rgba(120,120,128,0.9)"
              >
                {style.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="absolute right-3 top-3 hm-glass rounded-xl px-3 py-2 text-[11.5px] space-y-1">
        {Object.entries(NODE_STYLE).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.fill }} />
            <span className="hm-subtle">{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t hm-hairline mt-1">
          <span className="w-6 h-px" style={{ borderTop: '1.5px dashed #AF52DE' }} />
          <span className="hm-subtle">反事实链路</span>
        </div>
      </div>
    </div>
  );
}
