import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePaymentManageModalFlow } from './usePaymentManageModalFlow';

describe('usePaymentManageModalFlow', () => {
  it('opens edit modal without plantCd in editing row', () => {
    const { result } = renderHook(() =>
      usePaymentManageModalFlow({
        checkedIds: [],
        onSaveRow: vi.fn().mockResolvedValue(undefined),
        onDeleteRows: vi.fn().mockResolvedValue(0),
      }),
    );

    act(() => {
      result.current.openEditModal({
        id: 'pay-1',
        sysId: 'pay-1',
        rateCode: 'BASIC_M1',
        rateName: '베이직 플랜',
        rateAmount: 9900,
        rateUnit: '원',
        licenseValidMonth: 1,
      });
    });

    expect(result.current.editingRow).toEqual({
      id: 'pay-1',
      sysId: 'pay-1',
      rateCode: 'BASIC_M1',
      rateName: '베이직 플랜',
      rateAmount: '9900',
      rateUnit: '원',
      licenseValidMonth: '1',
    });
    expect(result.current.editingRow).not.toHaveProperty('plantCd');
  });

  it('saves create row without plantCd field', async () => {
    const onSaveRow = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePaymentManageModalFlow({
        checkedIds: [],
        onSaveRow,
        onDeleteRows: vi.fn().mockResolvedValue(0),
      }),
    );

    act(() => {
      result.current.openCreateModal();
      result.current.changeEditingField('rateCode', 'BASIC_M1');
      result.current.changeEditingField('rateName', '베이직 플랜');
      result.current.changeEditingField('rateAmount', '9900');
      result.current.changeEditingField('rateUnit', '원');
      result.current.changeEditingField('licenseValidMonth', '1');
      result.current.requestSave();
    });

    await act(async () => {
      await result.current.confirmSave();
    });

    expect(onSaveRow).toHaveBeenCalledWith(
      {
        id: '',
        rateCode: 'BASIC_M1',
        rateName: '베이직 플랜',
        rateAmount: '9900',
        rateUnit: '원',
        licenseValidMonth: '1',
      },
      true,
    );
    expect(onSaveRow.mock.calls[0][0]).not.toHaveProperty('plantCd');
  });
});
