import { describe, expect, it } from 'vitest';
import {
  buildRuleDetailRequest,
  createBlankRuleDetailValues,
  createEmptyRuleDetailSchema,
  hasRuleDetailChanges,
  mapToRuleDetailRow,
  mapToRuleMasterPayload,
  mapToRuleMasterRow,
} from './ruleManagementApi';
import type { RuleDetailRow } from '../types';

describe('ruleManagementApi', () => {
  it('creates an empty detail schema with cloned column definitions', () => {
    const firstSchema = createEmptyRuleDetailSchema();
    const secondSchema = createEmptyRuleDetailSchema();

    firstSchema.columns[0].label = '변경된 라벨';

    expect(secondSchema).toEqual({
      columns: [
        {
          key: 'optionCd',
          label: '옵션코드',
          type: 'text',
          required: true,
          readOnlyOnExisting: true,
        },
        { key: 'optionNm', label: '옵션명', type: 'text', required: true },
        { key: 'optionData', label: '옵션데이터', type: 'text', required: true },
        { key: 'description', label: '설명', type: 'text' },
      ],
      rows: [],
    });
  });

  it('creates blank values from detail column definitions', () => {
    const schema = createEmptyRuleDetailSchema();

    expect(createBlankRuleDetailValues(schema.columns)).toEqual({
      optionCd: '',
      optionNm: '',
      optionData: '',
      description: '',
    });
  });

  it('maps rule master DTO into page row and back to payload', () => {
    const row = mapToRuleMasterRow({
      sysId: 'rule-1',
      ruleCd: 'ORDER_STATUS',
      ruleNm: '주문상태',
      useYn: 'N',
    });

    expect(row).toEqual({
      id: 'rule-1',
      sysId: 'rule-1',
      code: 'ORDER_STATUS',
      name: '주문상태',
      useYn: 'N',
    });
    expect(mapToRuleMasterPayload(row)).toEqual({
      sysId: 'rule-1',
      ruleCd: 'ORDER_STATUS',
      ruleNm: '주문상태',
      useYn: 'N',
    });
  });

  it('maps rule detail DTO into dynamic detail row', () => {
    expect(
      mapToRuleDetailRow({
        sysId: 'detail-1',
        linkSysId: 'rule-1',
        optionCd: 'READY',
        optionNm: '준비',
        optionData: 'R',
        description: '준비 상태',
        ordNo: 3,
      }),
    ).toEqual({
      id: 'detail-1',
      sysId: 'detail-1',
      masterId: 'rule-1',
      ordNo: 3,
      values: {
        optionCd: 'READY',
        optionNm: '준비',
        optionData: 'R',
        description: '준비 상태',
      },
    });
  });

  it('builds empty detail request arrays when there are no rows', () => {
    const request = buildRuleDetailRequest([], []);

    expect(request).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
    expect(hasRuleDetailChanges(request)).toBe(false);
  });

  it('does not send unchanged existing detail rows as updates', () => {
    const originalRows: RuleDetailRow[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        masterId: 'rule-1',
        ordNo: 1,
        values: {
          optionCd: 'READY',
          optionNm: '준비',
          optionData: 'R',
          description: '',
        },
      },
    ];

    const request = buildRuleDetailRequest(
      [
        {
          ...originalRows[0],
          values: { ...originalRows[0].values },
        },
      ],
      originalRows,
    );

    expect(request).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
    expect(hasRuleDetailChanges(request)).toBe(false);
  });

  it('builds detail save request with new, update, and delete arrays', () => {
    const originalRows: RuleDetailRow[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        masterId: 'rule-1',
        ordNo: 1,
        values: {
          optionCd: 'READY',
          optionNm: '준비',
          optionData: 'R',
          description: '',
        },
      },
      {
        id: 'detail-2',
        sysId: 'detail-2',
        masterId: 'rule-1',
        ordNo: 2,
        values: {
          optionCd: 'DONE',
          optionNm: '완료',
          optionData: 'D',
          description: '',
        },
      },
    ];
    const currentRows: RuleDetailRow[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        masterId: 'rule-1',
        ordNo: 1,
        values: {
          optionCd: 'READY',
          optionNm: '준비중',
          optionData: 'R',
          description: '수정',
        },
      },
      {
        id: 'new-1',
        masterId: 'rule-1',
        ordNo: 2,
        isNew: true,
        values: {
          optionCd: 'HOLD',
          optionNm: '보류',
          optionData: 'H',
          description: '',
        },
      },
    ];

    const request = buildRuleDetailRequest(currentRows, originalRows);

    expect(request).toEqual({
      newItems: [
        {
          sysId: undefined,
          linkSysId: 'rule-1',
          optionCd: 'HOLD',
          optionNm: '보류',
          optionData: 'H',
          description: '',
          ordNo: 2,
        },
      ],
      updateItems: [
        {
          sysId: 'detail-1',
          linkSysId: 'rule-1',
          optionCd: 'READY',
          optionNm: '준비중',
          optionData: 'R',
          description: '수정',
          ordNo: 1,
        },
      ],
      delItems: [
        {
          sysId: 'detail-2',
          linkSysId: 'rule-1',
          optionCd: 'DONE',
          optionNm: '완료',
          optionData: 'D',
          description: '',
          ordNo: 2,
        },
      ],
    });
    expect(hasRuleDetailChanges(request)).toBe(true);
  });

  it('treats ordNo-only changes as updates because rule detail now has an ordNo contract', () => {
    const originalRows: RuleDetailRow[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        masterId: 'rule-1',
        ordNo: 1,
        values: {
          optionCd: 'READY',
          optionNm: '준비',
          optionData: 'R',
          description: '',
        },
      },
      {
        id: 'detail-2',
        sysId: 'detail-2',
        masterId: 'rule-1',
        ordNo: 2,
        values: {
          optionCd: 'DONE',
          optionNm: '완료',
          optionData: 'D',
          description: '',
        },
      },
    ];
    const currentRows: RuleDetailRow[] = [
      {
        ...originalRows[1],
        ordNo: 1,
      },
      {
        ...originalRows[0],
        ordNo: 2,
      },
    ];

    const request = buildRuleDetailRequest(currentRows, originalRows);

    expect(request).toEqual({
      newItems: [],
      updateItems: [
        {
          sysId: 'detail-2',
          linkSysId: 'rule-1',
          optionCd: 'DONE',
          optionNm: '완료',
          optionData: 'D',
          description: '',
          ordNo: 1,
        },
        {
          sysId: 'detail-1',
          linkSysId: 'rule-1',
          optionCd: 'READY',
          optionNm: '준비',
          optionData: 'R',
          description: '',
          ordNo: 2,
        },
      ],
      delItems: [],
    });
    expect(hasRuleDetailChanges(request)).toBe(true);
  });
});
