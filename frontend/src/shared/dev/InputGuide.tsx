/**
 * @fileoverview TextInput 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/input)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/InputGuide
 */

import { useState } from 'react';
import { TextInput } from '@/shared/components/input';

/* =====================================================
 * 간단한 섹션 레이아웃 헬퍼
 * ===================================================== */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'flex-start',
        }}
      >
        {children}
      </div>
    </section>
  );
}

/** 고정 너비 카드 래퍼 */
function Card({
  label,
  children,
  width = '280px',
}: {
  label: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div style={{ width }}>
      <p
        style={{
          fontSize: '0.7rem',
          color: 'var(--color-text-tertiary)',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/* =====================================================
 * 가이드 페이지 본체
 * ===================================================== */
export default function InputGuide() {
  const [value, setValue] = useState('');
  const [pwValue, setPwValue] = useState('');

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
            TextInput
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            개발 전용 미리보기 · <code style={{ fontSize: '0.8rem' }}>/dev/input</code>
          </p>
        </div>


        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size">
          <Card label="sm">
            <TextInput size="sm" label="Small" placeholder="30px" />
          </Card>
          <Card label="md (기본)">
            <TextInput size="md" label="Medium" placeholder="36px" />
          </Card>
          <Card label="lg">
            <TextInput size="lg" label="Large" placeholder="44px" />
          </Card>
        </Section>


        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="기본">
            <TextInput label="기본" placeholder="입력하세요" />
          </Card>
          <Card label="필수">
            <TextInput label="이메일" required placeholder="example@email.com" />
          </Card>
          <Card label="disabled">
            <TextInput label="비활성" disabled value="수정 불가" readOnly />
          </Card>
          <Card label="readOnly">
            <TextInput label="읽기 전용" readOnly value="읽기 전용 값" />
          </Card>
          <Card label="error">
            <TextInput
              label="이메일"
              errorText="올바른 이메일 형식이 아닙니다"
              defaultValue="wrong@"
            />
          </Card>
          <Card label="success">
            <TextInput
              label="아이디"
              successText="사용 가능한 아이디입니다"
              defaultValue="qrorder_dev"
            />
          </Card>
        </Section>


        {/* ─── 도움말 텍스트 ─────────────────────────────── */}
        <Section title="Helper Text">
          <Card label="hint">
            <TextInput
              label="닉네임"
              hint="한글·영문 2~10자"
              placeholder="닉네임 입력"
            />
          </Card>
          <Card label="infoText (항상 표시)">
            <TextInput
              label="비밀번호"
              infoText="영문·숫자 조합 8자 이상"
              placeholder="비밀번호 입력"
            />
          </Card>
          <Card label="infoText + error 동시">
            <TextInput
              label="비밀번호"
              infoText="영문·숫자 조합 8자 이상"
              errorText="비밀번호가 너무 짧습니다"
              defaultValue="abc"
            />
          </Card>
        </Section>


        {/* ─── 아이콘 슬롯 ───────────────────────────────── */}
        <Section title="Icon Slot">
          <Card label="leftIcon">
            <TextInput
              label="검색"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              }
              placeholder="검색어를 입력하세요"
            />
          </Card>
          <Card label="rightIcon">
            <TextInput
              label="금액"
              rightIcon={
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  원
                </span>
              }
              placeholder="0"
              type="number"
            />
          </Card>
          <Card label="leftIcon + rightIcon">
            <TextInput
              label="URL"
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              }
              rightIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              }
              placeholder="https://example.com"
            />
          </Card>
        </Section>


        {/* ─── 기능 ─────────────────────────────────────── */}
        <Section title="Feature">
          <Card label="비밀번호 토글">
            <TextInput
              label="비밀번호"
              type="password"
              showPasswordToggle
              infoText="영문·숫자 조합 8자 이상"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              placeholder="비밀번호 입력"
            />
          </Card>
          <Card label="로딩">
            <TextInput
              label="아이디 중복 확인"
              loading
              value="checking..."
              readOnly
            />
          </Card>
          <Card label="제어 컴포넌트 (onChange)">
            <TextInput
              label="실시간 입력"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              hint={value ? `${value.length}자 입력됨` : '입력해보세요'}
              placeholder="타이핑하면 hint가 바뀝니다"
            />
          </Card>
        </Section>


        {/* ─── 레이블 위치 ───────────────────────────────── */}
        <Section title="Label Position">
          <Card label="top (기본)" width="260px">
            <TextInput labelPosition="top" label="이름" placeholder="이름 입력" />
          </Card>
          <Card label="bottom" width="260px">
            <TextInput labelPosition="bottom" label="이름" placeholder="이름 입력" />
          </Card>
          <Card label="left" width="340px">
            <TextInput
              labelPosition="left"
              label="이름"
              labelWidth="4rem"
              placeholder="이름 입력"
            />
          </Card>
          <Card label="right" width="340px">
            <TextInput
              labelPosition="right"
              label="이름"
              labelWidth="4rem"
              placeholder="이름 입력"
            />
          </Card>
        </Section>


        {/* ─── 조합 예시 ─────────────────────────────────── */}
        <Section title="실제 사용 예시 — 로그인 폼">
          <div
            style={{
              width: '360px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <TextInput
              label="이메일"
              required
              type="email"
              placeholder="example@email.com"
              size="lg"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              }
            />
            <TextInput
              label="비밀번호"
              required
              type="password"
              showPasswordToggle
              size="lg"
              placeholder="비밀번호 입력"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
            />
          </div>
        </Section>

      </div>
    </div>
  );
}
