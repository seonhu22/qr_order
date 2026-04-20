import { useState } from 'react';
import type { PaymentRateRow } from '../types';

const MOCK_ROWS: PaymentRateRow[] = [
  { id: '1', rateCode: 'BASIC_MONTHLY', rateName: '베이직 플랜', rateAmount: 9900, rateUnit: '원', licensePeriod: '1개월' },
  { id: '2', rateCode: 'BASIC_YEARLY', rateName: '스탠다드 플랜', rateAmount: 19900, rateUnit: '달러', licensePeriod: '3개월' },
  { id: '3', rateCode: 'PRO_MONTHLY', rateName: '프리미엄 플랜', rateAmount: 39900, rateUnit: '원', licensePeriod: '12개월' },
];

export function usePaymentManagePageState() {
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<PaymentRateRow | null>(null);

  const rows = MOCK_ROWS.filter(
    (r) =>
      r.rateCode.includes(keyword) ||
      r.rateName.includes(keyword),
  );

  const isAllChecked = rows.length > 0 && checkedIds.length === rows.length;

  const handleSearch = () => {
    setKeyword(draftKeyword);
    setCheckedIds([]);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setCheckedIds([]);
  };

  const handleToggleRow = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    setCheckedIds(isAllChecked ? [] : rows.map((r) => r.id));
  };

  const handleCreate = () => {
    // TODO: 신규 모달 또는 행 추가 연결
  };

  const handleDelete = () => {
    // TODO: 삭제 확인 모달 연결
  };

  const handleOpenDetail = (row: PaymentRateRow) => {
    setDetailRow(row);
  };

  const handleCloseDetail = () => {
    setDetailRow(null);
  };

  return {
    data: { rows },
    uiProps: {
      draftKeyword,
      checkedIds,
      isAllChecked,
      detailRow,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch,
      handleReset,
      handleToggleRow,
      handleToggleAll,
      handleCreate,
      handleDelete,
      handleOpenDetail,
      handleCloseDetail,
    },
  };
}
