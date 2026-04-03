import { useMemo, useState } from 'react';
import '@/apps/admin/layout/AdminMainLayout.css';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { AdminMainNavigation } from '@/apps/admin/common/components/AdminMainNavigation';

type MasterCode = {
  id: string;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
};

type DetailCode = {
  id: string;
  code: string;
  name: string;
  useYn: boolean;
  checked: boolean;
};

// 임시 코드맵핑
const MASTER_ROWS: MasterCode[] = [
  { id: 'm1', code: 'ORDER_STATUS', name: '주문상태', useYn: 'Y' },
  { id: 'm2', code: 'ORDER_TYPE', name: '주문유형', useYn: 'Y' },
  { id: 'm3', code: 'PAYMENT_METHOD', name: '결제수단', useYn: 'Y' },
  { id: 'm4', code: 'DELIVERY_STATUS', name: '배송상태', useYn: 'N' },
];

const DETAIL_ROWS_BY_MASTER: Record<string, DetailCode[]> = {
  m1: [
    { id: 'd1', code: 'ORDER_STATUS', name: '코드명', useYn: true, checked: true },
    { id: 'd2', code: 'ORDER_STATUS', name: '코드명', useYn: false, checked: false },
    { id: 'd3', code: 'ORDER_STATUS', name: '코드명', useYn: false, checked: false },
  ],
  m2: [
    { id: 'd4', code: 'ORDER_TYPE', name: '포장', useYn: true, checked: false },
    { id: 'd5', code: 'ORDER_TYPE', name: '매장', useYn: true, checked: false },
  ],
  m3: [
    { id: 'd6', code: 'PAYMENT_METHOD', name: '카드', useYn: true, checked: false },
    { id: 'd7', code: 'PAYMENT_METHOD', name: '현금', useYn: false, checked: false },
  ],
  m4: [
    { id: 'd8', code: 'DELIVERY_STATUS', name: '대기', useYn: true, checked: false },
    { id: 'd9', code: 'DELIVERY_STATUS', name: '완료', useYn: true, checked: false },
  ],
};

export default function AdminMainLayout() {
  const [selectedMasterId, setSelectedMasterId] = useState<string>(MASTER_ROWS[0]?.id ?? '');
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [detailRows, setDetailRows] = useState<DetailCode[]>(
    DETAIL_ROWS_BY_MASTER[MASTER_ROWS[0]?.id] ?? [],
  );

  // ? 리액트 19에서 useMemo가 필요한가??
  const selectedMaster = useMemo(
    () => MASTER_ROWS.find((row) => row.id === selectedMasterId) ?? MASTER_ROWS[0],
    [selectedMasterId],
  );

  const onSelectMasterRow = (masterId: string) => {
    setSelectedMasterId(masterId);
    setDetailRows(DETAIL_ROWS_BY_MASTER[masterId] ?? []);
  };

  const toggleMasterChecked = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  const toggleDetailChecked = (detailId: string) => {
    setDetailRows((prev) =>
      prev.map((row) => (row.id === detailId ? { ...row, checked: !row.checked } : row)),
    );
  };

  const onDetailFieldChange = (detailId: string, key: 'code' | 'name', value: string) => {
    setDetailRows((prev) =>
      prev.map((row) => (row.id === detailId ? { ...row, [key]: value } : row)),
    );
  };

  const onDetailUseYnChange = (detailId: string, checked: boolean) => {
    setDetailRows((prev) =>
      prev.map((row) => (row.id === detailId ? { ...row, useYn: checked } : row)),
    );
  };

  return (
    <section className="common-code-page" aria-labelledby="common-code-page-title">
      <h1 id="common-code-page-title" className="common-code-page__sr-only">
        공통코드 관리
      </h1>

      {/* 네비게이션 */}
      <AdminMainNavigation depth1="시스템" depth2="시스템 관리" current="공통코드 관리" />

      {/* 마스터 테이블 */}
      <article className="common-code-card" aria-label="공통코드 마스터">
        <header className="common-code-card__header">
          <h2 className="common-code-card__title">공통코드 마스터</h2>
          <div className="common-code-card__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Icon id="i-plus" size={13} />}
            >
              신규
            </Button>
            <Button type="button" variant="outline" size="sm" disabled>
              삭제
            </Button>
          </div>
        </header>

        <div className="common-table-wrap">
          <table className="common-table" aria-label="공통코드 마스터 테이블">
            <colgroup>
              <col style={{ width: '3rem' }} />
              <col />
              <col />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '4rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="전체 선택" />
                </th>
                <th>공통코드</th>
                <th>공통코드명</th>
                <th>사용여부</th>
                <th aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {MASTER_ROWS.map((row) => {
                const isSelected = selectedMasterId === row.id;
                const isChecked = checkedMasterIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className={isSelected ? 'is-selected' : undefined}
                    onClick={() => onSelectMasterRow(row.id)}
                  >
                    <td>
                      {/* 기존 Input으로 대체가능한가? */}
                      <input
                        type="checkbox"
                        aria-label={`${row.code} 선택`}
                        checked={isChecked}
                        onChange={() => toggleMasterChecked(row.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                    <td className="common-table__mono">{row.code}</td>
                    <td>{row.name}</td>
                    <td>
                      <span
                        className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}
                      >
                        {row.useYn}
                      </span>
                    </td>
                    <td>
                      {/* 기존 Button 컴포넌트로 변경필요 */}
                      <button
                        type="button"
                        className="common-table__icon-button"
                        aria-label={`${row.code} 수정`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Icon id="i-modal-pencil" size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* 상세 테이블 */}
      <article className="common-code-card" aria-label="공통코드 상세">
        <header className="common-code-card__header">
          <h2 className="common-code-card__title">공통코드 상세</h2>
          <div className="common-code-card__actions common-code-card__actions--detail">
            <Button
              variant="icon"
              iconOnly={<Icon id="i-chevron-up" size={12} />}
              aria-label="위로 이동"
            />
            <Button
              variant="icon"
              iconOnly={<Icon id="i-chevron-down" size={12} />}
              aria-label="아래로 이동"
            />
            <Button
              type="button"
              variant="text"
              size="sm"
              style={{ padding: '0 var(--spacing-button-x-sm)' }}
            >
              + 행추가
            </Button>
            <Button
              type="button"
              variant="text"
              size="sm"
              style={{ padding: '0 var(--spacing-button-x-sm)' }}
            >
              - 행삭제
            </Button>
            <Button type="button" variant="outline" size="sm">
              저장
            </Button>
          </div>
        </header>

        <div className="common-table-wrap">
          <table className="common-table common-table--detail" aria-label="공통코드 상세 테이블">
            <colgroup>
              <col style={{ width: '3rem' }} />
              <col />
              <col />
              <col style={{ width: '8rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th aria-label="선택" />
                <th>공통코드</th>
                <th>공통코드명</th>
                <th>사용여부</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row) => (
                <tr key={row.id} className={row.checked ? 'is-selected' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.code} 선택`}
                      checked={row.checked}
                      onChange={() => toggleDetailChecked(row.id)}
                    />
                  </td>
                  <td>
                    <input
                      className="common-table__input common-table__mono"
                      value={row.code}
                      onChange={(event) => onDetailFieldChange(row.id, 'code', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="common-table__input"
                      value={row.name}
                      onChange={(event) => onDetailFieldChange(row.id, 'name', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.code} 사용 여부`}
                      checked={row.useYn}
                      onChange={(event) => onDetailUseYnChange(row.id, event.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
