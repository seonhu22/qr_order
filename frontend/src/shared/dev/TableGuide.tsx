/**
 * @fileoverview TableCard 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/table)
 * - 마스터 테이블(커스텀) / EditableMasterTable / EditableDetailTable / 상태 예시
 *
 * @module dev/TableGuide
 */

import { useState } from 'react';
import { CheckboxInput } from '@/shared/components/checkbox';
import { EditTableButton } from '@/shared/components/button';
import {
  EditableMasterTable,
  MasterTableActions,
  TableCard,
  TableCardContentState,
} from '@/shared/components/table';
import { EditableDetailTable } from '@/shared/components/table/EditableDetailTable';
import type { EditableDetailColumn, EditableDetailRow } from '@/shared/components/table/editableTableTypes';
import type { EditableMasterRow } from '@/shared/components/table/editableTableTypes';
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

type SampleMasterRow = EditableMasterRow & {
  rateUnit: string;
  useYn: 'Y' | 'N';
};

type SampleDetailRow = EditableDetailRow;

const INITIAL_MASTER_ROWS: SampleMasterRow[] = [
  { id: '1', code: 'BASIC',  name: '기본 요금', rateUnit: '월', useYn: 'Y' },
  { id: '2', code: 'PREMM',  name: '프리미엄',  rateUnit: '월', useYn: 'Y' },
  { id: '3', code: 'TRIAL',  name: '체험판',    rateUnit: '일', useYn: 'N' },
];

const INITIAL_DETAIL_ROWS: SampleDetailRow[] = [
  { id: 'd1', ordNo: 1, values: { code: 'A01', name: '항목 A', useYn: true } },
  { id: 'd2', ordNo: 2, values: { code: 'B01', name: '항목 B', useYn: false } },
];

const DETAIL_COLUMNS: EditableDetailColumn[] = [
  { key: 'code',  label: '코드',    type: 'text',    required: true, readOnlyOnExisting: true },
  { key: 'name',  label: '코드명',  type: 'text',    required: true },
  { key: 'useYn', label: '사용여부', type: 'boolean' },
];

/* =====================================================
 * 섹션 1 — 마스터 테이블 (커스텀 컬럼)
 * PaymentManageTable / NoticeManageTable / CouponManageTable 패턴
 * =====================================================
 *
 * 핵심 규칙:
 * - colgroup: checkbox → common-table__col--checkbox
 *             고정 너비 중간 컬럼 → common-table__col--md (8rem) or inline width
 *             action → common-table__col--action
 * - th: scope="col", aria-label 또는 텍스트 레이블
 *       체크박스 헤더는 aria-label="선택"
 *       수정 버튼 헤더는 빈 th + aria-label="수정"
 * - td 정렬: 기본 좌정렬 | common-table__cell--center | common-table__cell--left common-table__cell--truncate
 * - CheckboxInput은 <span className="common-table__checkbox"> 로 감싸기
 * - 빈 결과: rows.length===0 일 때 <td colSpan={N} className="common-table__empty">
 */
function CustomMasterTableExample() {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);

  const isAllChecked = checkedIds.length === INITIAL_MASTER_ROWS.length;
  const isIndeterminate = checkedIds.length > 0 && !isAllChecked;

  return (
    <TableCard
      title="결제 요금 목록"
      ariaLabel="결제 요금 목록"
      actions={<MasterTableActions onCreate={() => {}} onDelete={() => {}} />}
    >
      <TableCardContentState
        isLoading={false}
        isError={false}
        loadingTitle="결제 요금 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="결제 요금 목록 테이블">
            <colgroup>
              {/* 체크박스 */}
              <col className="common-table__col--checkbox" />
              {/* 코드: flex */}
              <col />
              {/* 이름: flex */}
              <col />
              {/* 단위: 고정 8rem = common-table__col--md */}
              <col className="common-table__col--md" />
              {/* 수정 버튼 */}
              <col className="common-table__col--action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" aria-label="선택">
                  <span className="common-table__checkbox">
                    <CheckboxInput
                      size="sm"
                      checked={isAllChecked}
                      indeterminate={isIndeterminate}
                      aria-label="전체 선택"
                      onChange={() => setCheckedIds(isAllChecked ? [] : INITIAL_MASTER_ROWS.map((r) => r.id))}
                    />
                  </span>
                </th>
                <th scope="col">결제 요금 코드</th>
                <th scope="col">결제 요금 명</th>
                <th scope="col">단위</th>
                <th scope="col" aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {INITIAL_MASTER_ROWS.length === 0 ? (
                <tr>
                  <td colSpan={5} className="common-table__empty">데이터가 없습니다.</td>
                </tr>
              ) : (
                INITIAL_MASTER_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="common-table__checkbox">
                        <CheckboxInput
                          size="sm"
                          checked={checkedIds.includes(row.id)}
                          aria-label={`${row.name} 선택`}
                          onChange={() => toggle(row.id)}
                        />
                      </span>
                    </td>
                    {/* 코드: 모노스페이스 */}
                    <td className="common-table__mono">{row.code}</td>
                    {/* 이름: 기본 좌정렬 (td 기본값) */}
                    <td>{row.name}</td>
                    {/* 단위: 중앙 정렬 */}
                    <td className="common-table__cell--center">{row.rateUnit}</td>
                    <td>
                      {/* EditTableButton: 행 클릭 이벤트 없으므로 stopPropagation 불필요 */}
                      <EditTableButton
                        ariaLabel={`${row.name} 수정`}
                        onClick={() => {}}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}

/* =====================================================
 * 섹션 1-b — truncate 패턴
 * NoticeManageTable처럼 긴 텍스트 컬럼 말줄임
 * =====================================================
 *
 * - col에 고정 너비 또는 page CSS로 max-width 지정
 * - td에 common-table__cell--left common-table__cell--truncate
 * - td에 title 속성 (hover 시 전체 텍스트 표시)
 */
const LONG_TEXT_ROWS = [
  { id: 't1', title: '시스템 점검 안내', content: '2026년 4월 30일 오전 2시부터 4시까지 시스템 점검이 진행됩니다.' },
  { id: 't2', title: '서비스 업데이트 공지', content: 'QR Order 2.0 업데이트가 적용되었습니다. 주요 변경 사항을 확인해주세요.' },
];

function TruncateTableExample() {
  return (
    <TableCard title="공지사항 목록 (truncate 예시)" ariaLabel="truncate 예시">
      <div className="common-table-wrap">
        <table className="common-table" aria-label="truncate 예시 테이블">
          <colgroup>
            {/* 제목: 고정 14rem */}
            <col className="table-guide__col--title" />
            {/* 내용: flex (나머지 공간) */}
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">제목</th>
              <th scope="col">내용</th>
            </tr>
          </thead>
          <tbody>
            {LONG_TEXT_ROWS.map((row) => (
              <tr key={row.id}>
                {/* 말줄임: common-table__cell--left + common-table__cell--truncate + title */}
                <td className="common-table__cell--left common-table__cell--truncate" title={row.title}>
                  {row.title}
                </td>
                <td className="common-table__cell--left common-table__cell--truncate" title={row.content}>
                  {row.content}
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
 * 섹션 2 — EditableMasterTable
 * CommonCodeMasterTable / RuleMasterTable 패턴
 * =====================================================
 *
 * 코드/이름/사용여부/수정 고정 컬럼 + 행 클릭 선택(is-selected) + 체크박스 + 수정버튼
 * 새 마스터 목록 구현 시 이 컴포넌트 사용 권장
 */
function EditableMasterTableExample() {
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  return (
    <EditableMasterTable
      title="공통코드 마스터"
      ariaLabel="공통코드 마스터"
      tableAriaLabel="공통코드 마스터 테이블"
      labels={{ code: '공통코드', name: '공통코드명' }}
      statusText={{ loading: '공통코드 목록을 불러오는 중입니다.' }}
      rows={INITIAL_MASTER_ROWS}
      isLoading={false}
      isError={false}
      selection={{
        selectedId: selectedMasterId,
        checkedIds,
        isAllChecked: checkedIds.length === INITIAL_MASTER_ROWS.length,
      }}
      actions={{
        onSelectRow: setSelectedMasterId,
        onToggleRow: (id) =>
          setCheckedIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
          ),
        onToggleAllRows: () =>
          setCheckedIds(
            checkedIds.length === INITIAL_MASTER_ROWS.length
              ? []
              : INITIAL_MASTER_ROWS.map((r) => r.id),
          ),
        onCreate: () => {},
        onEdit: () => {},
        onDelete: () => {},
      }}
    />
  );
}

/* =====================================================
 * 섹션 3 — EditableDetailTable
 * CommonCodeDetailTable 패턴
 * =====================================================
 *
 * 행 선택 + 이동 + 행추가/삭제 + 인라인 편집 + 저장
 * columns 정의로 text/boolean 컬럼 타입 지원
 */
function EditableDetailTableExample() {
  const [rows, setRows] = useState<SampleDetailRow[]>(INITIAL_DETAIL_ROWS);

  return (
    <EditableDetailTable
      table={{
        title: '공통코드 상세',
        ariaLabel: '공통코드 상세',
        tableAriaLabel: '공통코드 상세 테이블',
      }}
      statusText={{ loadingTitle: '상세 코드를 불러오는 중입니다.' }}
      data={{
        selectedMaster: INITIAL_MASTER_ROWS[0],
        rows,
        columns: DETAIL_COLUMNS,
        rowErrors: {},
      }}
      status={{ isLoading: false, isSaving: false }}
      actions={{
        onChangeValue: (rowId: string, key: string, value: string | boolean) =>
          setRows((prev) =>
            prev.map((r) => r.id === rowId ? { ...r, values: { ...r.values, [key]: value } } : r),
          ),
        onClearRowError: () => {},
        onAddRow: () => {
          const id = `new-${Date.now()}`;
          setRows((prev) => [
            ...prev,
            { id, ordNo: prev.length + 1, isNew: true, values: { code: '', name: '', useYn: true } },
          ]);
          return id;
        },
        onDeleteRow: (rowId?: string) =>
          setRows((prev) => prev.filter((r) => r.id !== rowId)),
        onMoveUp: (rowId?: string) => {
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === rowId);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
          });
        },
        onMoveDown: (rowId?: string) => {
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === rowId);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
          });
        },
        onSave: () => {},
      }}
    />
  );
}

/* =====================================================
 * TableGuide
 * ===================================================== */

export default function TableGuide() {
  return (
    <div className="table-guide">
      <h1 className="table-guide__title">TableCard</h1>

      {/* 1. 마스터 테이블 — 커스텀 컬럼 */}
      <Section
        title="마스터 테이블 — 커스텀 컬럼"
        desc="PaymentManageTable / CouponManageTable / NoticeManageTable 패턴. TableCard + MasterTableActions + TableCardContentState 조합"
      >
        <CustomMasterTableExample />
      </Section>

      {/* 1-b. truncate 패턴 */}
      <Section
        title="td 말줄임 (truncate)"
        desc="common-table__cell--left + common-table__cell--truncate + title 속성. 긴 텍스트 컬럼에 사용"
      >
        <TruncateTableExample />
      </Section>

      {/* 2. EditableMasterTable */}
      <Section
        title="EditableMasterTable"
        desc="CommonCodeMasterTable / RuleMasterTable 패턴. 코드/이름 고정 컬럼 + 행 클릭 선택(is-selected) + 체크박스 + 수정버튼"
      >
        <EditableMasterTableExample />
      </Section>

      {/* 3. EditableDetailTable */}
      <Section
        title="EditableDetailTable"
        desc="CommonCodeDetailTable 패턴. 행 선택 + 이동 + 행추가/삭제 + 인라인 편집 + 저장. columns prop으로 text/boolean 컬럼 타입 지정"
      >
        <EditableDetailTableExample />
      </Section>

      {/* 4. 로딩 상태 */}
      <Section title="로딩 상태" desc="TableCardContentState isLoading=true 시">
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
      <Section title="에러 상태" desc="TableCardContentState isError=true 시">
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

      {/* 6. 빈 상태 (마스터 미선택) */}
      <Section
        title="빈 상태 — 마스터 미선택"
        desc="title 생략 시 header 없음. 상세 카드에서 마스터를 선택하기 전 초기 상태"
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