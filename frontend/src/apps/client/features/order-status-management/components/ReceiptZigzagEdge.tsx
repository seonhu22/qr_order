import { useLayoutEffect, useRef, useState } from 'react';
import './ReceiptZigzagEdge.css';

const TOOTH_COUNT = 24;
const EDGE_HEIGHT = 6;
const TOOTH_RADIUS = 1;

type Point = { x: number; y: number };

function toothPoint(apex: Point, neighbor: Point, radius: number): Point {
  const dx = neighbor.x - apex.x;
  const dy = neighbor.y - apex.y;
  const len = Math.hypot(dx, dy);
  return { x: apex.x + (dx / len) * radius, y: apex.y + (dy / len) * radius };
}

/** 폭을 이빨 개수로 나눠 매번 대칭으로 맞아떨어지는 톱니 경로를 만든다 — 배경 타일링 방식과 달리 끝단이 어긋나지 않는다. */
function buildZigzagPath(width: number, height: number, teeth: number, radius: number): string {
  const toothWidth = width / teeth;
  let d = `M0,${height}`;
  for (let i = 0; i < teeth; i += 1) {
    const baseLeft = { x: i * toothWidth, y: height };
    const apex = { x: i * toothWidth + toothWidth / 2, y: 0 };
    const baseRight = { x: (i + 1) * toothWidth, y: height };
    const p1 = toothPoint(apex, baseLeft, radius);
    const p2 = toothPoint(apex, baseRight, radius);
    d += ` L${p1.x.toFixed(2)},${p1.y.toFixed(2)} Q${apex.x.toFixed(2)},${apex.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} L${baseRight.x.toFixed(2)},${baseRight.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

type ReceiptZigzagEdgeProps = {
  /** 아래쪽 edge는 위쪽과 같은 경로를 세로로 뒤집어 쓴다. */
  flip?: boolean;
};

/** 영수증 위/아래 톱니 edge. 실제 렌더링 폭을 측정해 경로를 그리므로 모달 폭이 달라져도 항상 대칭이다. */
export function ReceiptZigzagEdge({ flip = false }: ReceiptZigzagEdgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ width, path }, setGeometry] = useState({ width: 0, path: '' });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const update = () => {
      const measuredWidth = container.getBoundingClientRect().width;
      if (measuredWidth <= 0) return;
      setGeometry({
        width: measuredWidth,
        path: buildZigzagPath(measuredWidth, EDGE_HEIGHT, TOOTH_COUNT, TOOTH_RADIUS),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`receipt-zigzag${flip ? ' receipt-zigzag--flip' : ''}`}>
      {width > 0 && (
        <svg className="receipt-zigzag__svg" width={width} height={EDGE_HEIGHT} viewBox={`0 0 ${width} ${EDGE_HEIGHT}`}>
          <path className="receipt-zigzag__path" d={path} />
        </svg>
      )}
    </div>
  );
}
