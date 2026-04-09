/**
 * @fileoverview RadioInput 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/radio)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/RadioGuide
 */

import { useState } from 'react';
import { RadioInput, RadioGroup } from '@/shared/components/radio';

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
export default function RadioGuide() {
  const [selected, setSelected] = useState('');
  const [deliveryType, setDeliveryType] = useState('standard');

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
            RadioInput
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            개발 전용 미리보기 · <code style={{ fontSize: '0.8rem' }}>/dev/radio</code>
          </p>
        </div>

        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size">
          <Card label="sm (14px)">
            <RadioInput name="size-demo-sm" value="sm" size="sm" label="Small" defaultChecked />
          </Card>
          <Card label="md (16px) — 기본">
            <RadioInput name="size-demo-md" value="md" size="md" label="Medium" defaultChecked />
          </Card>
          <Card label="lg (18px)">
            <RadioInput name="size-demo-lg" value="lg" size="lg" label="Large" defaultChecked />
          </Card>
        </Section>

        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="기본 (unchecked)">
            <RadioInput name="state-default" value="a" label="미선택" />
          </Card>
          <Card label="checked">
            <RadioInput name="state-checked" value="a" label="선택됨" defaultChecked />
          </Card>
          <Card label="disabled (unchecked)">
            <RadioInput name="state-dis-off" value="a" label="비활성" disabled />
          </Card>
          <Card label="disabled (checked)">
            <RadioInput name="state-dis-on" value="a" label="비활성 선택됨" disabled defaultChecked />
          </Card>
          <Card label="error">
            <RadioInput name="state-error" value="a" label="필수 항목" errorText="항목을 선택해주세요" />
          </Card>
          <Card label="error (checked)">
            <RadioInput name="state-error-checked" value="a" label="선택됨" defaultChecked errorText="다시 확인해주세요" />
          </Card>
          <Card label="success">
            <RadioInput name="state-success" value="a" label="확인 완료" defaultChecked successText="올바르게 선택되었습니다" />
          </Card>
        </Section>

        {/* ─── 레이블 + 설명 ─────────────────────────────── */}
        <Section title="Description">
          <Card label="label만" width="240px">
            <RadioInput name="desc-a" value="a" label="일반 배달" defaultChecked />
          </Card>
          <Card label="label + description" width="240px">
            <RadioInput
              name="desc-b"
              value="b"
              label="빠른 배달"
              description="30분 내 도착 예상 (추가 요금 발생)"
              defaultChecked
            />
          </Card>
          <Card label="label + hint" width="240px">
            <RadioInput
              name="desc-c"
              value="c"
              label="직접 수령"
              hint="매장 방문 후 수령"
              defaultChecked
            />
          </Card>
          <Card label="label 없음 (원만)" width="120px">
            <RadioInput name="desc-d" value="d" defaultChecked />
          </Card>
        </Section>

        {/* ─── 도움말 텍스트 ─────────────────────────────── */}
        <Section title="Helper Text">
          <Card label="hint" width="240px">
            <RadioInput
              name="helper-hint"
              value="a"
              label="SMS 수신"
              hint="수신 동의 후 변경 가능"
            />
          </Card>
          <Card label="errorText" width="240px">
            <RadioInput
              name="helper-error"
              value="a"
              label="필수 선택 항목"
              errorText="항목을 선택해주세요"
            />
          </Card>
          <Card label="successText" width="240px">
            <RadioInput
              name="helper-success"
              value="a"
              label="인증 완료"
              defaultChecked
              successText="본인인증이 확인되었습니다"
            />
          </Card>
        </Section>

        {/* ─── RadioGroup ────────────────────────────────── */}
        <Section title="RadioGroup">
          <Card label="direction=col (기본)" width="240px">
            <RadioGroup
              name="group-col"
              label="배달 방법"
              defaultValue="standard"
              options={[
                { value: 'standard', label: '일반 배달' },
                { value: 'quick',    label: '빠른 배달' },
                { value: 'pickup',   label: '직접 수령', hint: '매장 방문' },
                { value: 'drone',    label: '드론 배달', disabled: true },
              ]}
            />
          </Card>
          <Card label="direction=row" width="400px">
            <RadioGroup
              name="group-row"
              label="사이즈 선택"
              direction="row"
              defaultValue="m"
              options={[
                { value: 's',  label: 'S' },
                { value: 'm',  label: 'M' },
                { value: 'l',  label: 'L' },
                { value: 'xl', label: 'XL' },
              ]}
            />
          </Card>
          <Card label="size=sm" width="240px">
            <RadioGroup
              name="group-sm"
              label="필터"
              size="sm"
              direction="row"
              defaultValue="all"
              options={[
                { value: 'all',  label: '전체' },
                { value: 'food', label: '음식' },
                { value: 'cafe', label: '카페' },
              ]}
            />
          </Card>
          <Card label="size=lg" width="240px">
            <RadioGroup
              name="group-lg"
              label="결제 수단"
              size="lg"
              defaultValue="card"
              options={[
                { value: 'card',   label: '카드' },
                { value: 'cash',   label: '현금' },
                { value: 'kakao',  label: '카카오페이' },
              ]}
            />
          </Card>
        </Section>

        {/* ─── RadioGroup 에러·성공 상태 ──────────────────── */}
        <Section title="RadioGroup — Helper Text">
          <Card label="errorText" width="240px">
            <RadioGroup
              name="group-error"
              label="배달 방법"
              options={[
                { value: 'standard', label: '일반 배달' },
                { value: 'quick',    label: '빠른 배달' },
              ]}
              errorText="배달 방법을 선택해주세요"
            />
          </Card>
          <Card label="successText" width="240px">
            <RadioGroup
              name="group-success"
              label="결제 수단"
              defaultValue="card"
              options={[
                { value: 'card',  label: '카드 결제' },
                { value: 'kakao', label: '카카오페이' },
              ]}
              successText="결제 수단이 확인되었습니다"
            />
          </Card>
          <Card label="hint" width="240px">
            <RadioGroup
              name="group-hint"
              label="수령 시간"
              defaultValue="noon"
              options={[
                { value: 'morning', label: '오전 (09:00–12:00)' },
                { value: 'noon',    label: '점심 (12:00–14:00)' },
                { value: 'evening', label: '저녁 (17:00–21:00)' },
              ]}
              hint="선택한 시간대에 맞춰 배달됩니다"
            />
          </Card>
        </Section>

        {/* ─── 제어 컴포넌트 ─────────────────────────────── */}
        <Section title="Controlled (onChange)">
          <Card label="외부 상태 연동" width="300px">
            <RadioGroup
              name="controlled"
              label="음료 선택"
              value={selected}
              onChange={setSelected}
              options={[
                { value: 'americano', label: '아메리카노' },
                { value: 'latte',     label: '카페 라떼' },
                { value: 'matcha',    label: '말차 라떼' },
              ]}
            />
            {selected && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                선택됨: <strong style={{ color: 'var(--color-brand-default)' }}>{selected}</strong>
              </p>
            )}
          </Card>
        </Section>

        {/* ─── 설명 포함 그룹 (카드 스타일) ─────────────── */}
        <Section title="Description 포함 그룹">
          <Card label="배달 방법 선택 카드" width="360px">
            <RadioGroup
              name="delivery-desc"
              label="배달 방법"
              value={deliveryType}
              onChange={setDeliveryType}
              options={[
                {
                  value: 'standard',
                  label: '일반 배달',
                  description: '40–60분 소요 · 무료',
                },
                {
                  value: 'quick',
                  label: '빠른 배달',
                  description: '20–30분 소요 · 추가 요금 1,000원',
                },
                {
                  value: 'pickup',
                  label: '직접 수령',
                  description: '매장 방문 후 수령',
                  hint: '영업 시간 내 방문 필요',
                },
                {
                  value: 'drone',
                  label: '드론 배달',
                  description: '서비스 준비 중',
                  disabled: true,
                },
              ]}
            />
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ────────────────────────────── */}
        <Section title="실제 사용 예시 — 주문 옵션">
          <div
            style={{
              width: '400px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <RadioGroup
              name="order-size"
              label="사이즈"
              direction="row"
              defaultValue="m"
              options={[
                { value: 's',  label: 'S (12oz)' },
                { value: 'm',  label: 'M (16oz)' },
                { value: 'l',  label: 'L (20oz)' },
              ]}
            />

            <div style={{ borderTop: '1px solid var(--color-border-divider)', paddingTop: '1.5rem' }}>
              <RadioGroup
                name="order-temp"
                label="온도"
                direction="row"
                defaultValue="ice"
                options={[
                  { value: 'hot',  label: '핫 (HOT)' },
                  { value: 'ice',  label: '아이스 (ICE)' },
                ]}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-divider)', paddingTop: '1.5rem' }}>
              <RadioGroup
                name="order-shot"
                label="에스프레소 샷"
                direction="row"
                defaultValue="single"
                options={[
                  { value: 'single', label: '1샷' },
                  { value: 'double', label: '2샷', hint: '+500원' },
                  { value: 'triple', label: '3샷', hint: '+1,000원' },
                ]}
              />
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
