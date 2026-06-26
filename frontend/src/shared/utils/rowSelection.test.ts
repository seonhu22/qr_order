import { describe, expect, it } from 'vitest';
import { getNextSelectedId } from './rowSelection';

const rows = [{ id: 'row-1' }, { id: 'row-2' }, { id: 'row-3' }];

describe('getNextSelectedId', () => {
  it('returns the next row id when deleting a middle row', () => {
    expect(getNextSelectedId(rows, 'row-2')).toBe('row-3');
  });

  it('returns the previous row id when deleting the last row', () => {
    expect(getNextSelectedId(rows, 'row-3')).toBe('row-2');
  });

  it('returns an empty string when deleting the only row', () => {
    expect(getNextSelectedId([{ id: 'row-1' }], 'row-1')).toBe('');
  });

  it('returns an empty string when the deleted id is not found', () => {
    expect(getNextSelectedId(rows, 'unknown')).toBe('');
  });
});
