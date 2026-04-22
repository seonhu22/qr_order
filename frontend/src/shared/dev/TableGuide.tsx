/**
 * @fileoverview TableCard 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/table)
 * - 읽기 전용 / 행 클릭 선택 / 인라인 행 편집 / 로딩·빈 상태 예시
 *
 * @module dev/TableGuide
 */

import { useState } from 'react';
import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase } from '@/shared/components/input';
import { EditTableButton } from '@/shared/components/button';
import {
  TableCard,
  TableCardContentState,
  MasterTableActions,
  DetailTableActions,
} from '@/shared/components/table';
import './devStyles/TableGuide.css';

/* =====================================================
 * 가이드 레이아웃 헬퍼
 * ===================================================== */

function Section({ title, desc, children }: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="table-guide__section">
      <div className="table-guide__section-header">
        <h2 className="table-guide__section-title">{title}</h2>
        {desc && <p className="table-guide__section-desc">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

/* =====================================================
 * 샘플 데이터 타입
 * ===================================================== */

type SampleRow = {
  id: string;
  code: string;
  name: string;
  useYn: boolean;
  isNew?: boolean;
};

const INITIAL_ROWS: SampleRow[] = [
  { id: '1', code: 'USE',  name: '사용',   useYn: true  },
  { id: '2', code: 'NUSE', name: '미사용', useYn: false },
  { id: '3', code: 'WAIT', name: '대기',   useYn: true  },
];

/* =====================================================
 * 섹션 2 — 행 클릭 선택 (마스터/AdminUser 패턴)
 * ===================================================== */

function RowSelectExample() {
  const [selectedId, setSelectedId] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  return (
    <TableCard
      title="행 클릭 선택"
      ariaLabel="행 클릭 선택 예시"
      actions={
        <MasterTableActions
          onCreate={() => {}}
          onDelete={() => {}}
        />
      }
    >
      <div className="common-table-wrap">
        <table className="common-table">
          <colgroup>
            <col className="common-table__col--checkbox" />
            <col />
            <col />
            <col style={{ width: '8rem' }} />
            <col className="common-table__col--action" />
          </colgroup>
          <thead>
            <tr>
              <th>
                <CheckboxInput
                  checked={checkedIds.length === INITIAL_ROWS.length}
                  onChange={() =>
                    setCheckedIds(
                      checkedIds.length === INITIAL_ROWS.length
                        ? []
                        : INITIAL_ROWS.map((r) => r.id),
                    )
                  }
                  size="sm"
                  className="common-table__checkbox"
                  aria-label="전체 선택"
                />
              </th>
              <th>코드</th>
              <th>코드명</th>
              <th>사용여부</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            {INITIAL_ROWS.map((row) => (
              <tr
                key={row.id}
                className={selectedId === row.id ? 'is-selected' : undefined}
                onClick={() => setSelectedId(row.id)}
              >
                <td>
                  <CheckboxInput
                    checked={checkedIds.includes(row.id)}
                    onChange={() => toggle(row.id)}
                    size="sm"
                    className="common-table__checkbox"
                    aria-label={`${row.code} 선택`}
                  />
                </td>
                <td className="common-table__mono common-table__cell--left">{row.code}</td>
                <td className="common-table__cell--left">{row.name}</td>
                <td>
                  <span className={`status-badge ${row.useYn ? 'status-badge--yes' : 'status-badge--no'}`}>
                    {row.useYn ? 'Y' : 'N'}
                  </span>
                </td>
                <td>
                  <EditTableButton
                    ariaLabel={`${row.code} 수정`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

/* =====================================================
 * 섹션 3 — 인라인 행 편집 (CommonCodeDetail 패턴)
 * ===================================================== */

function InlineEditExample() {
  const [rows, setRows] = useState<SampleRow[]>(INITIAL_ROWS);
  const [selectedId, setSelectedId] = useState('');

  const selectedIndex = rows.findIndex((r) => r.id === selectedId);
  const canMoveUp   = selectedId !== '' && selectedIndex > 0;
  const canMoveDown = selectedId !== '' && selectedIndex < rows.length - 1;

  const handleAddRow = () => {
    const newRow: SampleRow = {
      id: `new-${Date.now()}`,
      code: '',
      name: '',
      useYn: true,
      isNew: true,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = () => {
    setRows((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId('');
  };

  const handleMoveUp = () => {
    setRows((prev) => {
      const next = [...prev];
      [next[selectedIndex - 1], next[selectedIndex]] = [next[selectedIndex], next[selectedIndex - 1]];
      return next;
    });
  };

  const handleMoveDown = () => {
    setRows((prev) => {
      const next = [...prev];
      [next[selectedIndex], next[selectedIndex + 1]] = [next[selectedIndex + 1], next[selectedIndex]];
      return next;
    });
  };

  const handleFieldChange = (id: string, key: 'code' | 'name', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const handleUseYnChange = (id: string, checked: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, useYn: checked } : r)));
  };

  return (
    <TableCard
      title="공통코드 상세"
      ariaLabel="인라인 행 편집 예시"
      actionsClassName="common-code-card__actions--detail"
      actions={
        <DetailTableActions
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          canDelete={!!selectedId}
          isSaving={false}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
          onSave={() => {}}
        />
      }
    >
      <div className="common-table-wrap">
        <table className="common-table common-table--detail">
          <colgroup>
            <col />
            <col />
            <col className="table-guide__col--use-yn" />
          </colgroup>
          <thead>
            <tr>
              <th>공통코드</th>
              <th>공통코드명</th>
              <th>사용여부</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={selectedId === row.id ? 'is-selected' : undefined}
                onClick={() => setSelectedId(row.id)}
              >
                <td>
                  <InputBase
                    size="sm"
                    className={`common-table__input${row.isNew ? '' : ' common-table__input--readonly-code'}`}
                    controlState={row.isNew ? '' : 'readonly'}
                    readOnly={!row.isNew}
                    value={row.code}
                    onChange={(e) => handleFieldChange(row.id, 'code', e.target.value)}
                    aria-label={`${row.code || '신규'} 코드`}
                  />
                </td>
                <td>
                  <InputBase
                    size="sm"
                    className="common-table__input"
                    value={row.name}
                    onChange={(e) => handleFieldChange(row.id, 'name', e.target.value)}
                    aria-label={`${row.code || '신규'} 코드명`}
                  />
                </td>
                <td>
                  <CheckboxInput
                    checked={row.useYn}
                    onChange={(checked) => handleUseYnChange(row.id, checked)}
                    size="sm"
                    className="common-table__checkbox"
                    aria-label={`${row.code || '신규'} 사용 여부`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="common-code-card__footnote">행을 클릭하면 선택됩니다. 행추가 후 편집할 수 있습니다.</p>
    </TableCard>
  );
}

/* =====================================================
 * TableGuide
 * ===================================================== */

export default function TableGuide() {
  return (
    <div className="table-guide">
      <h1 className="table-guide__title">TableCard</h1>

      {/* 1. 읽기 전용 */}
      <Section title="읽기 전용" desc="actions 없이 타이틀만. 행 클릭 불가 (PlantSearchTable 패턴)">
        <div className="table-guide__readonly">
          <TableCard title="사업장 목록" ariaLabel="읽기 전용 예시">
            <div className="common-table-wrap">
              <table className="common-table">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>코드명</th>
                    <th>사용여부</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td className="common-table__mono common-table__cell--left">{row.code}</td>
                      <td className="common-table__cell--left">{row.name}</td>
                      <td>
                        <span className={`status-badge ${row.useYn ? 'status-badge--yes' : 'status-badge--no'}`}>
                          {row.useYn ? 'Y' : 'N'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        </div>
      </Section>

      {/* 2. 행 클릭 선택 — 마스터/AdminUser 패턴 */}
      <Section
        title="행 클릭 선택"
        desc="행 클릭 → is-selected 강조. 체크박스 + 수정 아이콘 버튼 포함 (CommonCodeMasterTable / AdminUserTable 패턴)"
      >
        <RowSelectExample />
      </Section>

      {/* 3. 인라인 행 편집 — CommonCodeDetail 패턴 */}
      <Section
        title="인라인 행 편집"
        desc="행 클릭 선택 + 행추가/삭제 + 위아래 이동 + InputBase·CheckboxInput 인라인 편집 (CommonCodeDetailTable 패턴)"
      >
        <InlineEditExample />
      </Section>

      {/* 4. 로딩 상태 */}
      <Section title="로딩 상태" desc="isLoading 시 TableCardContentState에 위임">
        <div className="table-guide__preview-box">
          <TableCard title="공통코드 목록" ariaLabel="로딩 예시">
            <TableCardContentState
              isLoading
              isError={false}
              loadingTitle="목록을 불러오는 중입니다."
            >
              <></>
            </TableCardContentState>
          </TableCard>
        </div>
      </Section>

      {/* 5. 에러 상태 */}
      <Section title="에러 상태" desc="isError 시 TableCardContentState에 위임">
        <div className="table-guide__preview-box">
          <TableCard title="공통코드 목록" ariaLabel="에러 예시">
            <TableCardContentState
              isLoading={false}
              isError
              loadingTitle=""
              errorDescription="다시 한번 시도해주세요."
            >
              <></>
            </TableCardContentState>
          </TableCard>
        </div>
      </Section>

      {/* 6. header 없는 빈 상태 */}
      <Section
        title="header 없는 빈 상태"
        desc="title을 생략하면 header가 렌더링되지 않음 — 마스터 미선택 시 상세 카드 패턴"
      >
        <div className="table-guide__preview-box">
          <TableCard ariaLabel="빈 상태 예시">
            <TableCardContentState
              isLoading={false}
              isError={false}
              isEmpty
              loadingTitle=""
              emptyTitle="목록을 선택해주세요"
              emptyDescription="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
              emptyClassName="common-code-card__empty"
            >
              <></>
            </TableCardContentState>
          </TableCard>
        </div>
      </Section>
    </div>
  );
}