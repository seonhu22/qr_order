import { describe, expect, it } from 'vitest';
import { buildTableGuiRequest } from './tableLayoutApi';
import type { PlacedNonTableItem, PlacedTableItem } from '../types';

describe('buildTableGuiRequest', () => {
  it('sends non-table facilities with tableNum fallback for the table_info NOT NULL column', () => {
    const kitchen: PlacedNonTableItem = {
      id: 'facility-kitchen',
      kind: 'kitchen',
      x: 24.4,
      y: 280.2,
      width: 140,
      height: 56,
    };
    const custom: PlacedNonTableItem = {
      id: 'facility-custom',
      kind: 'custom',
      label: '셀프바',
      x: 200,
      y: 320,
      width: 160,
      height: 60,
    };

    const request = buildTableGuiRequest([], [], [kitchen, custom], []);

    expect(request.newItems).toEqual([
      expect.objectContaining({
        objectType: '02',
        tableType: 'kitchen',
        tableName: '주방',
        tableNum: 0,
        tableQty: 0,
        xCoordinate: 24,
        yCoordinate: 280,
      }),
      expect.objectContaining({
        objectType: '03',
        tableName: '셀프바',
        tableNum: 0,
        tableQty: 0,
      }),
    ]);
  });

  it('keeps real table numbers for table placement payloads', () => {
    const table: PlacedTableItem = {
      id: 'table-1',
      sysId: 'table-sys-1',
      kind: 'table',
      tableNum: '7',
      tableName: '창가',
      seatCount: 4,
      x: 10,
      y: 20,
      width: 152,
      height: 144,
    };

    const request = buildTableGuiRequest([table], [], [], []);

    expect(request.newItems?.[0]).toEqual(
      expect.objectContaining({
        objectType: '01',
        tableNum: 7,
        tableQty: 4,
      }),
    );
  });
});
