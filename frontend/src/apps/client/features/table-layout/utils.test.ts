import { describe, expect, it } from 'vitest';
import { snapPositionToNearbyItems } from './utils';
import type { PlacedFacilityItem } from './types';

function facility(id: string, x: number, y: number, width: number, height: number): PlacedFacilityItem {
  return { id, kind: 'counter', x, y, width, height };
}

describe('snapPositionToNearbyItems', () => {
  it('returns the original position unchanged when there are no other items', () => {
    const box = { x: 100, y: 100, width: 50, height: 50 };
    expect(snapPositionToNearbyItems(box, [])).toEqual({ x: 100, y: 100 });
  });

  it('snaps the left edge to another item left edge within the threshold', () => {
    const other = facility('a', 200, 0, 80, 80);
    const box = { x: 205, y: 300, width: 50, height: 50 }; // 5px off, within default threshold
    expect(snapPositionToNearbyItems(box, [other])).toEqual({ x: 200, y: 300 });
  });

  it('does not snap when the closest edge is outside the threshold', () => {
    const other = facility('a', 200, 0, 80, 80);
    const box = { x: 250, y: 300, width: 50, height: 50 }; // 50px off, beyond default threshold (20px)
    expect(snapPositionToNearbyItems(box, [other])).toEqual({ x: 250, y: 300 });
  });

  it('snaps to whichever edge candidate is closest among several', () => {
    const other = facility('a', 0, 0, 100, 100); // left=0, right=100
    // box.x=92 is 8px from other.right(100) and 92px from other.left(0) — should snap to the right edge match
    const box = { x: 92, y: 300, width: 50, height: 50 };
    const result = snapPositionToNearbyItems(box, [other]);
    expect(result.x).toBe(100);
  });

  it('snaps x/y axes independently', () => {
    const other = facility('a', 200, 500, 80, 80);
    const box = { x: 204, y: 308, width: 50, height: 50 };
    // x close to other's left(200), y close to other's bottom(580)... use a clear y target instead
    const result = snapPositionToNearbyItems(box, [other]);
    expect(result.x).toBe(200);
    // y(308) isn't within threshold of any of other's edges (500, 580, 420, 500-50=450), so it stays put
    expect(result.y).toBe(308);
  });

  it('continues an existing equal gap between two row-mates for a third item', () => {
    // Two items in the same row with a 20px gap between them: [0,100) and [120,220)
    const left = facility('a', 0, 0, 100, 50);
    const right = facility('b', 120, 0, 100, 50);
    // Dropping a same-sized box just to the right of "right", off by a few px from the continued gap (240)
    const box = { x: 245, y: 10, width: 100, height: 50 };
    const result = snapPositionToNearbyItems(box, [left, right]);
    expect(result.x).toBe(240); // right.x + right.width + gap = 120 + 100 + 20
  });

  it('respects a custom threshold argument', () => {
    const other = facility('a', 200, 0, 80, 80);
    const box = { x: 215, y: 300, width: 50, height: 50 }; // 15px off
    expect(snapPositionToNearbyItems(box, [other], 10)).toEqual({ x: 215, y: 300 }); // outside custom threshold
    expect(snapPositionToNearbyItems(box, [other], 20)).toEqual({ x: 200, y: 300 }); // within custom threshold
  });
});
