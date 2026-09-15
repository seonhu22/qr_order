/**
 * @fileoverview 검색폼(필터카드) 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/filter)
 * - 코드베이스에 실재하는 검색폼 레이아웃 4종을 단순→복합 순으로 모두 보여준다
 *   1. `SearchFilterCard` — 키워드 + 버튼만 (가장 단순, 공용 컴포넌트 그대로 사용)
 *   2. `AccessLogFilters` 스타일 — 키워드 + 날짜range만(콤보 없음)
 *   3. `ChangeHistoryFilters` 스타일 — 콤보 1개 + 키워드 + 날짜range(프리셋 없음)
 *   4. `OrderHistoryFilters`/`PaymentStatusFilters` 스타일 — 콤보 + 키워드 + 프리셋 콤보 + 날짜range
 * - 2·3·4는 실제 공용 훅(`useQueryDateRangeDraft`/`useDateRangePresetDraft`)을 그대로 사용해
 *   동작까지 live로 확인할 수 있다
 *
 * @module dev/FilterGuide
 */

import { useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import { useQueryDateRangeDraft } from '@/shared/hooks/useQueryDateRangeDraft';
import { useDateRangePresetDraft } from '@/shared/hooks/useDateRangePresetDraft';
import type { DateRangePresetKey } from '@/shared/hooks/useDateRangePresetDraft';
import './devStyles/FilterGuide.css';

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="dev-guide__section">
      <div className="dev-guide__section-header">
        <h2 className="dev-guide__section-title">{title}</h2>
        {desc && <p className="filter-guide__section-desc">{desc}</p>}
      </div>
      <div className="dev-guide__section-body">{children}</div>
    </section>
  );
}

/* =====================================================
 * 1. SearchFilterCard — 키워드 + 버튼만 (가장 단순)
 * 사용처: ClientUserPage, CommonCodePage, PlantSearchPage, RuleManagementPage 등 10여 곳
 * ===================================================== */
function SearchFilterCardExample() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  return (
    <div className="filter-guide__demo">
      <SearchFilterCard
        ariaLabel="검색 예시"
        inputId="filter-guide-search-only"
        inputAriaLabel="검색어"
        placeholder="아이디, 이름으로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => setAppliedKeyword(draftKeyword)}
        onReset={() => {
          setDraftKeyword('');
          setAppliedKeyword('');
        }}
      />
      {appliedKeyword && <pre className="filter-guide__applied-params">{JSON.stringify({ keyword: appliedKeyword }, null, 2)}</pre>}
    </div>
  );
}

/* =====================================================
 * 2. AccessLogFilters 스타일 — 키워드 + 날짜range만(콤보 없음), 최대 7일
 * 사용처: AccessLogFilters(접속정보조회)
 * ===================================================== */
function KeywordDateRangeExample() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedParams, setAppliedParams] = useState<Record<string, string> | null>(null);

  const {
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  } = useQueryDateRangeDraft(7);

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;
    setAppliedParams({ keyword: draftKeyword, startDate: draftStartDate, endDate: draftEndDate });
  };

  const handleReset = () => {
    setDraftKeyword('');
    resetDraftDateRange();
    setAppliedParams(null);
  };

  return (
    <div className="filter-guide__demo">
      <article className="filter-guide__card" aria-label="키워드+날짜range 검색폼 예시">
        <div className="filter-guide__flex">
          <InputWrapper inputId="filter-guide-kd-keyword">
            <InputBase
              id="filter-guide-kd-keyword"
              size="md"
              value={draftKeyword}
              placeholder="사용자 아이디, 사용자명으로 검색"
              leftSlot={<Icon id="i-search" size={14} />}
              onChange={(e) => setDraftKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </InputWrapper>
        </div>

        <div className="filter-guide__row">
          <div className="filter-guide__date-range">
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-kd-start">
                <InputBase
                  id="filter-guide-kd-start"
                  type="datetime-local"
                  size="md"
                  value={draftStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
            <span className="filter-guide__date-sep">~</span>
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-kd-end">
                <InputBase
                  id="filter-guide-kd-end"
                  type="datetime-local"
                  size="md"
                  value={draftEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
          </div>
          <div className="filter-guide__actions">
            <ResetFilterButton onClick={handleReset} />
            <SearchFilterButton onClick={handleSearch} />
          </div>
        </div>

        {dateRangeError ? (
          <p className="filter-guide__error">{dateRangeError}</p>
        ) : (
          <p className="filter-guide__hint">조회 기간은 최대 7일까지 설정할 수 있습니다.</p>
        )}
      </article>

      {appliedParams && <pre className="filter-guide__applied-params">{JSON.stringify(appliedParams, null, 2)}</pre>}
    </div>
  );
}

/* =====================================================
 * 3. ChangeHistoryFilters 스타일 — 콤보 1개 + 키워드(1행) + 날짜range+버튼(2행, 프리셋 없음), 최대 7일
 * 사용처: ChangeHistoryFilters(변경 이력 조회)
 * ===================================================== */
const AUDIT_FLAG_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'I', label: '등록' },
  { value: 'U', label: '수정' },
  { value: 'D', label: '삭제' },
];

function SingleComboKeywordDateExample() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftAuditFlag, setDraftAuditFlag] = useState('ALL');
  const [appliedParams, setAppliedParams] = useState<Record<string, string> | null>(null);

  const {
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  } = useQueryDateRangeDraft(7);

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;
    setAppliedParams({
      auditFlag: draftAuditFlag === 'ALL' ? '' : draftAuditFlag,
      keyword: draftKeyword,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
  };

  const handleReset = () => {
    setDraftKeyword('');
    setDraftAuditFlag('ALL');
    resetDraftDateRange();
    setAppliedParams(null);
  };

  return (
    <div className="filter-guide__demo">
      <article className="filter-guide__card" aria-label="콤보+키워드+날짜range 검색폼 예시">
        <div className="filter-guide__row">
          <div className="filter-guide__fixed">
            <SelectInput size="md" value={draftAuditFlag} options={AUDIT_FLAG_OPTIONS} onChange={setDraftAuditFlag} />
          </div>
          <div className="filter-guide__flex">
            <InputWrapper inputId="filter-guide-sc-keyword">
              <InputBase
                id="filter-guide-sc-keyword"
                size="md"
                value={draftKeyword}
                placeholder="메뉴명, 수정내용으로 검색"
                leftSlot={<Icon id="i-search" size={14} />}
                onChange={(e) => setDraftKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </InputWrapper>
          </div>
        </div>

        <div className="filter-guide__row">
          <div className="filter-guide__date-range">
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-sc-start">
                <InputBase
                  id="filter-guide-sc-start"
                  type="datetime-local"
                  size="md"
                  value={draftStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
            <span className="filter-guide__date-sep">~</span>
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-sc-end">
                <InputBase
                  id="filter-guide-sc-end"
                  type="datetime-local"
                  size="md"
                  value={draftEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
          </div>
          <div className="filter-guide__actions">
            <ResetFilterButton onClick={handleReset} />
            <SearchFilterButton onClick={handleSearch} />
          </div>
        </div>

        {dateRangeError ? (
          <p className="filter-guide__error">{dateRangeError}</p>
        ) : (
          <p className="filter-guide__hint">조회 기간은 최대 7일까지 설정할 수 있습니다.</p>
        )}
      </article>

      {appliedParams && <pre className="filter-guide__applied-params">{JSON.stringify(appliedParams, null, 2)}</pre>}
    </div>
  );
}

/* =====================================================
 * 4. OrderHistoryFilters/PaymentStatusFilters 스타일
 * 콤보 + 키워드(1행) + 프리셋 콤보 + 날짜range + 버튼(2행), 기본 7일/최대 365일
 * ===================================================== */
const DATE_PRESET_OPTIONS = [
  { value: 'direct', label: '직접 선택' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'year', label: '최근 1년' },
];

/** 빈 문자열(전체) 의미를 sentinel 'ALL'로 표현 — SelectInput은 value:''인 옵션을 무효 처리해 제외한다 */
const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '상태 전체' },
  { value: 'OPEN', label: '진행중' },
  { value: 'CLOSED', label: '종료' },
];

function ComboKeywordPresetDateExample() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState('ALL');
  const [appliedParams, setAppliedParams] = useState<Record<string, string> | null>(null);

  const {
    draftPreset,
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handlePresetChange,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  } = useDateRangePresetDraft({ defaultRangeDays: 7, maxRangeDays: 365 });

  const handleSearch = () => {
    if (!validateDraftDateRange()) return;
    setAppliedParams({
      keyword: draftKeyword,
      status: draftStatus === 'ALL' ? '' : draftStatus,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
  };

  const handleReset = () => {
    setDraftKeyword('');
    setDraftStatus('ALL');
    resetDraftDateRange();
    setAppliedParams(null);
  };

  return (
    <div className="filter-guide__demo">
      <article className="filter-guide__card" aria-label="검색폼 예시">
        {/* 1행 — 상태 필터(좌) + 키워드(우) */}
        <div className="filter-guide__row">
          <div className="filter-guide__fixed">
            <SelectInput
              size="md"
              value={draftStatus}
              options={STATUS_FILTER_OPTIONS}
              onChange={setDraftStatus}
            />
          </div>
          <div className="filter-guide__flex">
            <InputWrapper inputId="filter-guide-keyword">
              <InputBase
                id="filter-guide-keyword"
                size="md"
                value={draftKeyword}
                placeholder="검색어를 입력하세요"
                leftSlot={<Icon id="i-search" size={14} />}
                onChange={(e) => setDraftKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </InputWrapper>
          </div>
        </div>

        {/* 2행 — 기간 프리셋 + 날짜range + 버튼 */}
        <div className="filter-guide__row">
          <div className="filter-guide__fixed">
            <SelectInput
              size="md"
              value={draftPreset}
              options={DATE_PRESET_OPTIONS}
              onChange={(value) => handlePresetChange(value as DateRangePresetKey)}
            />
          </div>
          <div className="filter-guide__date-range">
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-start">
                <InputBase
                  id="filter-guide-start"
                  type="datetime-local"
                  size="md"
                  value={draftStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
            <span className="filter-guide__date-sep">~</span>
            <div className="filter-guide__flex">
              <InputWrapper inputId="filter-guide-end">
                <InputBase
                  id="filter-guide-end"
                  type="datetime-local"
                  size="md"
                  value={draftEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </InputWrapper>
            </div>
          </div>
          <div className="filter-guide__actions">
            <ResetFilterButton onClick={handleReset} />
            <SearchFilterButton onClick={handleSearch} />
          </div>
        </div>

        {dateRangeError ? (
          <p className="filter-guide__error">{dateRangeError}</p>
        ) : (
          <p className="filter-guide__hint">조회 기간은 최대 1년(365일)까지 설정할 수 있습니다.</p>
        )}
      </article>

      {appliedParams && <pre className="filter-guide__applied-params">{JSON.stringify(appliedParams, null, 2)}</pre>}
    </div>
  );
}

export default function FilterGuide() {
  return (
    <div className="dev-guide">
      <div className="dev-guide__header">
        <h1 className="dev-guide__title">검색폼 (필터카드)</h1>
        <p className="dev-guide__description">
          개발 전용 미리보기 · <code>/dev/filter</code> · 실제 화면에 쓰이는 검색폼 레이아웃 4종을 단순→복합 순으로 정리했다.
        </p>
      </div>

      <Section
        title="1. 키워드 + 버튼만 (SearchFilterCard)"
        desc="ClientUserPage / CommonCodePage / PlantSearchPage / RuleManagementPage 등. 날짜·콤보 필터가 필요 없는 가장 단순한 목록 조회 화면에 그대로 재사용한다."
      >
        <SearchFilterCardExample />
      </Section>

      <Section
        title="2. 키워드 + 날짜range (콤보 없음)"
        desc="AccessLogFilters(접속정보조회) 패턴. 상태/유형 구분이 없는 기간 조회 화면. useQueryDateRangeDraft(7)만 사용."
      >
        <KeywordDateRangeExample />
      </Section>

      <Section
        title="3. 콤보 1개 + 키워드 + 날짜range (프리셋 없음)"
        desc="ChangeHistoryFilters(변경 이력 조회) 패턴. 콤보+키워드를 1행, 날짜range+버튼을 2행에 배치하되 프리셋 콤보는 없다."
      >
        <SingleComboKeywordDateExample />
      </Section>

      <Section
        title="4. 콤보 + 키워드 + 기간 프리셋 + 날짜range"
        desc="OrderHistoryFilters / PaymentStatusFilters 패턴. 가장 복합적인 형태 — 조회 버튼을 눌러야 하단에 적용된 파라미터가 표시된다(필터 변경 즉시 반영 아님)."
      >
        <ComboKeywordPresetDateExample />
      </Section>

      <Section title="규약 체크리스트" desc="이 패턴을 새 화면에 적용할 때 지켜야 하는 규칙">
        <ul className="filter-guide__checklist">
          <li>
            <code>SelectInput</code>은 <code>value: &apos;&apos;</code>인 옵션을 무효 처리해 드롭다운에서 제외한다.
            &quot;전체&quot;/&quot;직접 선택&quot;처럼 빈 값이 필요하면 <code>&apos;ALL&apos;</code>/<code>&apos;direct&apos;</code> 같은
            sentinel 값을 쓰고, 검색 파라미터를 만드는 데이터 계층에서 실제 빈 문자열로 변환한다.
          </li>
          <li>
            날짜range가 필요 없으면 <code>SearchFilterCard</code>를 그대로 쓴다. 날짜range만 필요하면
            <code>useQueryDateRangeDraft(maxRangeDays)</code>를 쓴다.
          </li>
          <li>
            기본 조회기간과 최대 허용기간이 다르면(예: 기본 7일 / 최대 365일) <code>shared/hooks/useDateRangePresetDraft.ts</code>를
            쓴다. <code>useQueryDateRangeDraft</code>는 두 값에 같은 인자를 쓰므로 이런 화면에는 맞지 않는다.
          </li>
          <li>
            기간 프리셋이 선택된 상태에서 시작·종료일시 중 하나를 바꾸면 프리셋 일수를 유지하도록 반대쪽 날짜가
            자동 재계산된다(<code>getAutoEndDate</code>/<code>getAutoStartDate</code>). &quot;직접 선택&quot; 상태에서는
            자동 계산 없이 입력값을 최대일수로만 검증한다.
          </li>
          <li>필터를 바꿔도 조회 버튼을 누르기 전까지는 검색 결과에 반영하지 않는다(즉시 반영 아님).</li>
          <li>콤보가 2개 이상이거나 프리셋이 있으면 키워드 행과 날짜range 행을 분리해 2행 구조로 배치한다.</li>
        </ul>
      </Section>
    </div>
  );
}
