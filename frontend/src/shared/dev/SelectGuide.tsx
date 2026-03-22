/**
 * @fileoverview SelectInput 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/select)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/SelectGuide
 */

import { useState } from 'react';
import { SelectInput } from '@/shared/components/input';
import type { SelectOption } from '@/shared/components/input';

/* =====================================================
 * 섹션 · 카드 헬퍼 (InputGuide 와 동일한 패턴)
 * ===================================================== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          borderBottom: '1px solid var(--color-border-divider)',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

function Card({ label, children, width = '280px' }: { label: string; children: React.ReactNode; width?: string }) {
  return (
    <div style={{ width }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
        {label}
      </p>
      {children}
    </div>
  );
}


/* =====================================================
 * 샘플 옵션 데이터
 * ===================================================== */

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'coffee',    label: '커피' },
  { value: 'tea',       label: '차' },
  { value: 'juice',     label: '주스' },
  { value: 'smoothie',  label: '스무디' },
  { value: 'beer',      label: '맥주' },
];

const MENU_OPTIONS: SelectOption[] = [
  { value: 'americano',  label: '아메리카노',   description: '에스프레소 + 물',     group: '커피' },
  { value: 'latte',      label: '카페라테',     description: '에스프레소 + 우유',   group: '커피' },
  { value: 'cappuccino', label: '카푸치노',     description: '에스프레소 + 우유 거품', group: '커피' },
  { value: 'greentea',   label: '녹차',         description: '국산 녹차 티백',      group: '논커피' },
  { value: 'chamomile',  label: '캐모마일',     description: '허브 진정 효과',      group: '논커피' },
  { value: 'orange',     label: '오렌지 주스',  description: '국내산 100%',         group: '주스' },
  { value: 'apple',      label: '사과 주스',    description: '국내산 100%',         group: '주스' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active',    label: '운영 중' },
  { value: 'inactive',  label: '운영 종료',  disabled: true },
  { value: 'preparing', label: '준비 중' },
];


/* =====================================================
 * 가이드 페이지 본체
 * ===================================================== */
export default function SelectGuide() {
  const [value, setValue] = useState('');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-app)',
        padding: '2rem',
        fontFamily: 'var(--typography-font-base)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '3rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem',
            }}
          >
            SelectInput
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            개발 전용 미리보기 · <code style={{ fontSize: '0.8rem' }}>/dev/select</code>
          </p>
        </div>

        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size">
          <Card label="sm">
            <SelectInput size="sm" label="Small" options={CATEGORY_OPTIONS} placeholder="30px" />
          </Card>
          <Card label="md (기본)">
            <SelectInput size="md" label="Medium" options={CATEGORY_OPTIONS} placeholder="36px" />
          </Card>
          <Card label="lg">
            <SelectInput size="lg" label="Large" options={CATEGORY_OPTIONS} placeholder="44px" />
          </Card>
        </Section>

        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="기본">
            <SelectInput label="카테고리" options={CATEGORY_OPTIONS} placeholder="선택하세요" />
          </Card>
          <Card label="필수">
            <SelectInput label="카테고리" required options={CATEGORY_OPTIONS} placeholder="선택하세요" />
          </Card>
          <Card label="disabled">
            <SelectInput label="비활성" disabled options={CATEGORY_OPTIONS} defaultValue="coffee" />
          </Card>
          <Card label="readOnly">
            <SelectInput label="읽기 전용" readOnly options={CATEGORY_OPTIONS} defaultValue="tea" />
          </Card>
          <Card label="error">
            <SelectInput
              label="카테고리"
              options={CATEGORY_OPTIONS}
              errorText="카테고리를 선택해주세요"
            />
          </Card>
          <Card label="success">
            <SelectInput
              label="카테고리"
              options={CATEGORY_OPTIONS}
              defaultValue="coffee"
              successText="선택이 완료되었습니다"
            />
          </Card>
          <Card label="loading">
            <SelectInput
              label="카테고리"
              options={CATEGORY_OPTIONS}
              loading
              placeholder="불러오는 중..."
            />
          </Card>
          <Card label="disabled option 포함">
            <SelectInput
              label="운영 상태"
              options={STATUS_OPTIONS}
              placeholder="상태 선택"
            />
          </Card>
        </Section>

        {/* ─── 도움말 텍스트 ─────────────────────────────── */}
        <Section title="Helper Text">
          <Card label="hint">
            <SelectInput
              label="음료"
              options={CATEGORY_OPTIONS}
              hint="판매 중인 카테고리만 표시됩니다"
              placeholder="선택하세요"
            />
          </Card>
          <Card label="infoText (항상 표시)">
            <SelectInput
              label="사업장"
              options={CATEGORY_OPTIONS}
              infoText="본인이 관리 중인 사업장만 선택 가능합니다"
              placeholder="선택하세요"
            />
          </Card>
          <Card label="infoText + error 동시">
            <SelectInput
              label="사업장"
              options={CATEGORY_OPTIONS}
              infoText="본인이 관리 중인 사업장만 선택 가능합니다"
              errorText="사업장을 선택해주세요"
            />
          </Card>
        </Section>

        {/* ─── 검색 ─────────────────────────────────────── */}
        <Section title="Searchable">
          <Card label="searchable" width="320px">
            <SelectInput
              label="메뉴"
              options={MENU_OPTIONS}
              searchable
              placeholder="메뉴를 선택하세요"
            />
          </Card>
          <Card label="searchable + 검색 결과 없음 확인" width="320px">
            <SelectInput
              label="메뉴"
              options={MENU_OPTIONS}
              searchable
              hint="'없는메뉴' 를 검색해보세요"
              placeholder="메뉴를 선택하세요"
            />
          </Card>
        </Section>

        {/* ─── 그룹핑 ───────────────────────────────────── */}
        <Section title="Grouping">
          <Card label="group 없음" width="280px">
            <SelectInput
              label="카테고리"
              options={CATEGORY_OPTIONS}
              placeholder="선택하세요"
            />
          </Card>
          <Card label="group 있음" width="280px">
            <SelectInput
              label="메뉴"
              options={MENU_OPTIONS}
              placeholder="메뉴를 선택하세요"
            />
          </Card>
          <Card label="group + searchable" width="280px">
            <SelectInput
              label="메뉴"
              options={MENU_OPTIONS}
              searchable
              placeholder="메뉴를 선택하세요"
            />
          </Card>
        </Section>

        {/* ─── 레이블 위치 ───────────────────────────────── */}
        <Section title="Label Position">
          <Card label="top (기본)" width="260px">
            <SelectInput labelPosition="top" label="카테고리" options={CATEGORY_OPTIONS} placeholder="선택하세요" />
          </Card>
          <Card label="bottom" width="260px">
            <SelectInput labelPosition="bottom" label="카테고리" options={CATEGORY_OPTIONS} placeholder="선택하세요" />
          </Card>
          <Card label="left" width="340px">
            <SelectInput
              labelPosition="left"
              label="카테고리"
              labelWidth="5rem"
              options={CATEGORY_OPTIONS}
              placeholder="선택하세요"
            />
          </Card>
          <Card label="right" width="340px">
            <SelectInput
              labelPosition="right"
              label="카테고리"
              labelWidth="5rem"
              options={CATEGORY_OPTIONS}
              placeholder="선택하세요"
            />
          </Card>
        </Section>

        {/* ─── 제어 컴포넌트 ─────────────────────────────── */}
        <Section title="Controlled (onChange)">
          <Card label="선택값 외부 표시" width="320px">
            <SelectInput
              label="음료 선택"
              options={CATEGORY_OPTIONS}
              value={value}
              onChange={(v) => setValue(v)}
              hint={value ? `선택된 값: ${value}` : '선택하면 hint 에 표시됩니다'}
              placeholder="선택하세요"
            />
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ────────────────────────────── */}
        <Section title="실제 사용 예시 — 메뉴 등록 폼">
          <div
            style={{
              width: '400px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <SelectInput
              label="카테고리"
              required
              size="lg"
              options={CATEGORY_OPTIONS}
              placeholder="카테고리 선택"
              hint="등록할 메뉴의 카테고리를 선택해주세요"
            />
            <SelectInput
              label="메뉴"
              required
              size="lg"
              options={MENU_OPTIONS}
              searchable
              placeholder="메뉴 검색 후 선택"
            />
            <SelectInput
              label="운영 상태"
              size="lg"
              options={STATUS_OPTIONS}
              defaultValue="active"
            />
          </div>
        </Section>

      </div>
    </div>
  );
}
