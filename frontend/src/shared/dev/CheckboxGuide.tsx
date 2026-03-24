/**
 * @fileoverview CheckboxInput 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/checkbox)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/CheckboxGuide
 */

import { useState } from 'react';
import { CheckboxInput, CheckboxGroup } from '@/shared/components/checkbox';

/* =====================================================
 * 섹션 · 카드 헬퍼
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

function Card({ label, children, width = 'auto' }: { label: string; children: React.ReactNode; width?: string }) {
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
 * 가이드 페이지 본체
 * ===================================================== */
export default function CheckboxGuide() {
  const [checked, setChecked] = useState(false);
  const [terms, setTerms] = useState({ all: false, age: false, privacy: false, marketing: false });

  /** 전체 선택 상태 계산 */
  const checkedCount = [terms.age, terms.privacy, terms.marketing].filter(Boolean).length;
  const allChecked   = checkedCount === 3;
  const someChecked  = checkedCount > 0 && !allChecked;

  const handleAllChange = (v: boolean) =>
    setTerms({ all: v, age: v, privacy: v, marketing: v });

  const handleTermChange = (key: keyof Omit<typeof terms, 'all'>) => (v: boolean) =>
    setTerms((prev) => ({ ...prev, [key]: v, all: false }));

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
            CheckboxInput
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            개발 전용 미리보기 · <code style={{ fontSize: '0.8rem' }}>/dev/checkbox</code>
          </p>
        </div>

        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size">
          <Card label="sm (16px)">
            <CheckboxInput size="sm" label="Small" defaultChecked />
          </Card>
          <Card label="md (20px) — 기본">
            <CheckboxInput size="md" label="Medium" defaultChecked />
          </Card>
          <Card label="lg (24px)">
            <CheckboxInput size="lg" label="Large" defaultChecked />
          </Card>
        </Section>

        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="기본 (unchecked)">
            <CheckboxInput label="미선택" />
          </Card>
          <Card label="checked">
            <CheckboxInput label="선택됨" defaultChecked />
          </Card>
          <Card label="indeterminate">
            <CheckboxInput label="부분 선택" indeterminate />
          </Card>
          <Card label="disabled (unchecked)">
            <CheckboxInput label="비활성" disabled />
          </Card>
          <Card label="disabled (checked)">
            <CheckboxInput label="비활성 선택됨" disabled defaultChecked />
          </Card>
          <Card label="disabled (indeterminate)">
            <CheckboxInput label="비활성 부분 선택" disabled indeterminate />
          </Card>
          <Card label="error">
            <CheckboxInput label="필수 항목" errorText="필수 항목을 선택해주세요" />
          </Card>
          <Card label="error (checked)">
            <CheckboxInput label="필수 항목" defaultChecked errorText="이미 처리된 항목입니다" />
          </Card>
          <Card label="success">
            <CheckboxInput label="인증 완료" defaultChecked successText="확인되었습니다" />
          </Card>
        </Section>

        {/* ─── 레이블 + 설명 ─────────────────────────────── */}
        <Section title="Description">
          <Card label="label만" width="260px">
            <CheckboxInput label="마케팅 정보 수신 동의" />
          </Card>
          <Card label="label + description" width="260px">
            <CheckboxInput
              label="마케팅 정보 수신 동의"
              description="이벤트·혜택 정보를 이메일·SMS로 받습니다"
            />
          </Card>
          <Card label="description + hint" width="260px">
            <CheckboxInput
              label="위치 정보 이용 동의"
              description="서비스 이용을 위해 위치 정보를 사용합니다"
              hint="선택 동의 항목입니다"
            />
          </Card>
          <Card label="label 없음 (박스만)" width="120px">
            <CheckboxInput />
          </Card>
        </Section>

        {/* ─── 도움말 텍스트 ─────────────────────────────── */}
        <Section title="Helper Text">
          <Card label="hint" width="260px">
            <CheckboxInput
              label="이용약관 동의"
              hint="전체 내용을 확인 후 동의해주세요"
            />
          </Card>
          <Card label="errorText" width="260px">
            <CheckboxInput
              label="필수 동의 항목"
              errorText="필수 항목을 선택해주세요"
            />
          </Card>
          <Card label="successText" width="260px">
            <CheckboxInput
              label="본인인증 완료"
              defaultChecked
              successText="본인인증이 확인되었습니다"
            />
          </Card>
        </Section>

        {/* ─── 그룹 ─────────────────────────────────────── */}
        <Section title="CheckboxGroup">
          <Card label="direction=col (기본)" width="240px">
            <CheckboxGroup label="관심 카테고리">
              <CheckboxInput label="음식" defaultChecked />
              <CheckboxInput label="음료" />
              <CheckboxInput label="디저트" defaultChecked />
              <CheckboxInput label="주류" disabled />
            </CheckboxGroup>
          </Card>
          <Card label="direction=row" width="360px">
            <CheckboxGroup label="요일 선택" direction="row">
              <CheckboxInput label="월" />
              <CheckboxInput label="화" defaultChecked />
              <CheckboxInput label="수" defaultChecked />
              <CheckboxInput label="목" />
              <CheckboxInput label="금" defaultChecked />
              <CheckboxInput label="토" />
              <CheckboxInput label="일" />
            </CheckboxGroup>
          </Card>
        </Section>

        {/* ─── 제어 컴포넌트 ─────────────────────────────── */}
        <Section title="Controlled (onChange)">
          <Card label="외부 상태 연동" width="280px">
            <CheckboxInput
              label="알림 수신"
              checked={checked}
              onChange={setChecked}
              hint={checked ? '알림 수신 중' : '알림이 꺼져 있습니다'}
            />
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ────────────────────────────── */}
        <Section title="실제 사용 예시 — 약관 동의">
          <div
            style={{
              width: '400px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* 전체 선택 */}
            <div
              style={{
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--color-border-divider)',
              }}
            >
              <CheckboxInput
                size="md"
                label="전체 동의"
                description="필수·선택 항목에 모두 동의합니다"
                checked={allChecked}
                indeterminate={someChecked}
                onChange={handleAllChange}
              />
            </div>

            {/* 개별 항목 */}
            <CheckboxInput
              label="(필수) 만 14세 이상입니다"
              checked={terms.age}
              onChange={handleTermChange('age')}
            />
            <CheckboxInput
              label="(필수) 개인정보 수집·이용 동의"
              description="서비스 제공을 위한 최소한의 정보를 수집합니다"
              checked={terms.privacy}
              onChange={handleTermChange('privacy')}
            />
            <CheckboxInput
              label="(선택) 마케팅 정보 수신 동의"
              description="이벤트·혜택 정보를 이메일·SMS로 받습니다"
              checked={terms.marketing}
              onChange={handleTermChange('marketing')}
            />

            {/* 미선택 시 에러 표시 */}
            {!terms.age && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-status-error-text)', margin: 0 }}>
                필수 항목에 모두 동의해주세요
              </p>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
