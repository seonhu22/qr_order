/**
 * @fileoverview TableCard 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/table)
 * - 타이틀만 / 타이틀+액션 / header 없는 빈 상태 예시
 *
 * @module dev/TableGuide
 */

import { Button } from '@/shared/components/button';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
import { CheckboxInput } from '@/shared/components/checkbox';

/* =====================================================
 * 가이드 레이아웃 헬퍼
 * ===================================================== */

function Section({ title, desc, children }: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--spacing-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-4)',
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--typography-size-ui)', fontWeight: 'var(--typography-weight-ui)', color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
        {desc && (
          <p style={{ margin: '4px 0 0', fontSize: 'var(--typography-size-sidebar)', color: 'var(--color-text-tertiary)' }}>
            {desc}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/* =====================================================
 * 샘플 테이블 데이터
 * ===================================================== */

const sampleRows = [
  { id: '1', code: 'USE',  name: '사용',   useYn: 'Y' },
  { id: '2', code: 'NUSE', name: '미사용', useYn: 'N' },
  { id: '3', code: 'WAIT', name: '대기',   useYn: 'Y' },
];

/* =====================================================
 * TableGuide
 * ===================================================== */

export default function TableGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)', padding: 'var(--spacing-8)' }}>
      <h1 style={{ margin: 0, fontSize: 'var(--typography-size-heading)', fontWeight: 'var(--typography-weight-ui)', color: 'var(--color-text-primary)' }}>
        TableCard
      </h1>

      {/* 1. 타이틀만 */}
      <Section title="타이틀만" desc="actions 없이 타이틀만 표시">
        <TableCard title="공통코드 목록" ariaLabel="공통코드 목록 예시">
          <div className="common-table-wrap">
            <table className="common-table">
              <thead>
                <tr>
                  <th className="common-table__cell--left">코드</th>
                  <th className="common-table__cell--left">코드명</th>
                  <th>사용여부</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="common-table__mono common-table__cell--left">{row.code}</td>
                    <td className="common-table__cell--left">{row.name}</td>
                    <td>
                      <span className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}>
                        {row.useYn}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      </Section>

      {/* 2. 타이틀 + 액션 버튼 */}
      <Section title="타이틀 + 액션" desc="actions prop으로 헤더 우측에 버튼 배치">
        <TableCard
          title="관리자 목록"
          ariaLabel="관리자 목록 예시"
          actions={
            <>
              <Button type="button" variant="outline" size="sm">행추가</Button>
              <Button type="button" variant="outline" size="sm">행삭제</Button>
              <Button type="button" variant="primary" size="sm">저장</Button>
            </>
          }
        >
          <div className="common-table-wrap">
            <table className="common-table">
              <colgroup>
                <col style={{ width: '3rem' }} />
                <col />
                <col />
                <col style={{ width: '8rem' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <CheckboxInput checked={false} onChange={() => {}} size="sm" className="common-table__checkbox" aria-label="전체 선택" />
                  </th>
                  <th className="common-table__cell--left">코드</th>
                  <th className="common-table__cell--left">코드명</th>
                  <th>사용여부</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <CheckboxInput checked={false} onChange={() => {}} size="sm" className="common-table__checkbox" aria-label={`${row.code} 선택`} />
                    </td>
                    <td className="common-table__mono common-table__cell--left">{row.code}</td>
                    <td className="common-table__cell--left">{row.name}</td>
                    <td>
                      <span className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}>
                        {row.useYn}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      </Section>

      {/* 3. 로딩 상태 */}
      <Section title="로딩 상태" desc="isLoading 시 FeedbackState를 children으로 전달">
        <div style={{ height: '200px', display: 'flex', flexDirection: 'column' }}>
          <TableCard title="공통코드 목록" ariaLabel="로딩 예시">
            <FeedbackState variant="loading" title="목록을 불러오는 중입니다." />
          </TableCard>
        </div>
      </Section>

      {/* 4. header 없는 빈 상태 */}
      <Section title="header 없는 빈 상태" desc="title을 생략하면 header가 렌더링되지 않음 (CommonCodeDetailTable 마스터 미선택 시 패턴)">
        <div style={{ height: '200px', display: 'flex', flexDirection: 'column' }}>
          <TableCard ariaLabel="빈 상태 예시">
            <FeedbackState
              variant="empty"
              title="목록을 선택해주세요"
              description="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
              className="common-code-card__empty"
            />
          </TableCard>
        </div>
      </Section>

      {/* 5. actionsClassName — detail 간격 */}
      <Section title="actionsClassName" desc="actionsClassName으로 액션 간격을 좁힌 상세 테이블 패턴">
        <TableCard
          title="공통코드 상세"
          ariaLabel="상세 예시"
          actionsClassName="common-code-card__actions--detail"
          actions={
            <>
              <Button variant="text" size="sm">+ 행추가</Button>
              <Button variant="text" size="sm" disabled>- 행삭제</Button>
              <Button variant="outline" size="sm">저장</Button>
            </>
          }
        >
          <div className="common-table-wrap">
            <table className="common-table">
              <thead>
                <tr>
                  <th className="common-table__cell--left">코드</th>
                  <th className="common-table__cell--left">코드명</th>
                  <th>사용여부</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="common-table__cell--left">{row.code}</td>
                    <td className="common-table__cell--left">{row.name}</td>
                    <td>
                      <span className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}>
                        {row.useYn}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      </Section>
    </div>
  );
}