import { SNAP_THRESHOLD_PX } from './constants';
import type { PlacedItem } from './types';

type Box = { x: number; y: number; width: number; height: number };

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function pickClosest(candidates: number[], threshold: number): number | null {
  let best: number | null = null;
  for (const delta of candidates) {
    if (Math.abs(delta) >= threshold) continue;
    if (best === null || Math.abs(delta) < Math.abs(best)) best = delta;
  }
  return best;
}

/** 가장자리(좌/우) 일치 후보 — `other`와 `box`의 왼쪽/오른쪽 끝이 맞아떨어지는 box.x 값들. */
function edgeCandidatesX(box: Box, other: PlacedItem): number[] {
  const otherLeft = other.x;
  const otherRight = other.x + other.width;
  return [otherLeft, otherRight, otherLeft - box.width, otherRight - box.width];
}

/** 가장자리(상/하) 일치 후보 — `other`와 `box`의 위/아래 끝이 맞아떨어지는 box.y 값들. */
function edgeCandidatesY(box: Box, other: PlacedItem): number[] {
  const otherTop = other.y;
  const otherBottom = other.y + other.height;
  return [otherTop, otherBottom, otherTop - box.height, otherBottom - box.height];
}

/**
 * 균등 간격 후보(X) — 같은 행(세로 범위가 겹치는)에 이미 일정한 간격으로 놓인 두 아이템이 있으면,
 * 그 간격을 그대로 이어가는 box.x 값들을 후보로 낸다. 테이블을 줄지어 같은 간격으로 나열할 때 쓴다.
 */
function spacingCandidatesX(box: Box, otherItems: PlacedItem[]): number[] {
  const rowMates = otherItems.filter((other) =>
    rangesOverlap(box.y, box.y + box.height, other.y, other.y + other.height),
  );
  if (rowMates.length < 2) return [];

  const sorted = [...rowMates].sort((a, b) => a.x - b.x);
  const candidates: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].x - (sorted[i].x + sorted[i].width);
    if (gap < 0) continue;
    candidates.push(sorted[i + 1].x + sorted[i + 1].width + gap); // sorted[i+1] 오른쪽에 같은 간격으로 이어붙이기
    candidates.push(sorted[i].x - gap - box.width); // sorted[i] 왼쪽에 같은 간격으로 이어붙이기
  }
  return candidates;
}

/** 균등 간격 후보(Y) — `spacingCandidatesX`의 세로축 버전. 같은 열에 있는 아이템들의 간격을 이어간다. */
function spacingCandidatesY(box: Box, otherItems: PlacedItem[]): number[] {
  const columnMates = otherItems.filter((other) =>
    rangesOverlap(box.x, box.x + box.width, other.x, other.x + other.width),
  );
  if (columnMates.length < 2) return [];

  const sorted = [...columnMates].sort((a, b) => a.y - b.y);
  const candidates: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].y - (sorted[i].y + sorted[i].height);
    if (gap < 0) continue;
    candidates.push(sorted[i + 1].y + sorted[i + 1].height + gap);
    candidates.push(sorted[i].y - gap - box.height);
  }
  return candidates;
}

/**
 * 드롭 시점에 다른 배치 아이템과 가까우면 자동으로 정렬한다. x축/y축은 독립적으로 계산하고,
 * 후보가 여러 개면 가장 가까운 것을 쓴다. 두 종류를 함께 본다 —
 * 1) 가장자리(좌/우/상/하) 일치, 2) 같은 행/열에 이미 놓인 두 아이템의 균등 간격을 그대로 이어가기.
 */
export function snapPositionToNearbyItems(
  box: Box,
  otherItems: PlacedItem[],
  threshold: number = SNAP_THRESHOLD_PX,
): { x: number; y: number } {
  const xTargets = otherItems.flatMap((other) => edgeCandidatesX(box, other));
  xTargets.push(...spacingCandidatesX(box, otherItems));
  const bestDeltaX = pickClosest(
    xTargets.map((target) => target - box.x),
    threshold,
  );

  const yTargets = otherItems.flatMap((other) => edgeCandidatesY(box, other));
  yTargets.push(...spacingCandidatesY(box, otherItems));
  const bestDeltaY = pickClosest(
    yTargets.map((target) => target - box.y),
    threshold,
  );

  return {
    x: box.x + (bestDeltaX ?? 0),
    y: box.y + (bestDeltaY ?? 0),
  };
}
