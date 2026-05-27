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
import { TextInput, TextareaInput } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import './devStyles/InputGuide.css';

/* =====================================================
 * 간단한 섹션 레이아웃 헬퍼
 * ===================================================== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dev-guide__section">
      <div className="dev-guide__section-header">
        <h2 className="dev-guide__section-title">{title}</h2>
      </div>
      <div className="dev-guide__section-body">
        <div className="dev-guide__grid">
        {children}
        </div>
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
      <p className="dev-guide__item-label">{label}</p>
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
    <div className="dev-guide">
        {/* 헤더 */}
        <div className="dev-guide__header">
          <h1 className="dev-guide__title">TextInput</h1>
          <p className="dev-guide__description">
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
            <TextInput label="닉네임" hint="한글·영문 2~10자" placeholder="닉네임 입력" />
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
              leftIcon={<Icon id="i-search" size={16} />}
              placeholder="검색어를 입력하세요"
            />
          </Card>
          <Card label="rightIcon">
            <TextInput
              label="금액"
              rightIcon={
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>원</span>
              }
              placeholder="0"
              type="number"
            />
          </Card>
          <Card label="leftIcon + rightIcon">
            <TextInput
              label="URL"
              leftIcon={<Icon id="i-link" size={14} />}
              rightIcon={<Icon id="i-check" size={14} />}
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
            <TextInput label="아이디 중복 확인" loading value="checking..." readOnly />
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

        {/* =====================================================
         * Textarea
         * ===================================================== */}
        <div className="input-guide-section-title">
          <h1 className="input-guide-section-title__heading">TextareaInput</h1>
          <p className="input-guide-section-title__sub">
            개발 전용 미리보기 · <code>/dev/input</code>
          </p>
        </div>

        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="기본" width="320px">
            <TextareaInput label="메모" rows={3} placeholder="내용을 입력하세요" />
          </Card>
          <Card label="필수" width="320px">
            <TextareaInput label="사유" required rows={3} placeholder="필수 입력 항목입니다" />
          </Card>
          <Card label="disabled" width="320px">
            <TextareaInput label="비활성" disabled rows={3} value="수정 불가" readOnly />
          </Card>
          <Card label="readOnly" width="320px">
            <TextareaInput label="읽기 전용" readOnly rows={3} value="읽기 전용 값입니다." />
          </Card>
          <Card label="error" width="320px">
            <TextareaInput
              label="내용"
              errorText="내용을 입력해주세요"
              rows={3}
              defaultValue="너무 짧습니다."
            />
          </Card>
          <Card label="success" width="320px">
            <TextareaInput
              label="설명"
              successText="적절한 길이입니다"
              rows={3}
              defaultValue="내용이 올바르게 입력되었습니다."
            />
          </Card>
        </Section>

        {/* ─── 도움말 텍스트 ─────────────────────────────── */}
        <Section title="Helper Text">
          <Card label="hint" width="320px">
            <TextareaInput label="메모" hint="최대 500자까지 입력 가능합니다" rows={3} placeholder="내용을 입력하세요" />
          </Card>
          <Card label="infoText (항상 표시)" width="320px">
            <TextareaInput
              label="공지사항 내용"
              infoText="HTML 태그는 사용할 수 없습니다"
              rows={3}
              placeholder="내용을 입력하세요"
            />
          </Card>
          <Card label="infoText + error 동시" width="320px">
            <TextareaInput
              label="내용"
              infoText="최대 500자까지 입력 가능합니다"
              errorText="내용이 너무 짧습니다"
              rows={3}
              defaultValue="짧음"
            />
          </Card>
        </Section>

        {/* ─── resize ────────────────────────────────────── */}
        <Section title="Resize">
          <Card label="none (기본)" width="320px">
            <TextareaInput label="고정" resize="none" rows={4} placeholder="크기 조절 불가" />
          </Card>
          <Card label="vertical" width="320px">
            <TextareaInput label="세로 조절" resize="vertical" rows={4} placeholder="세로만 조절 가능" />
          </Card>
          <Card label="both" width="320px">
            <TextareaInput label="양방향 조절" resize="both" rows={4} placeholder="가로·세로 모두 조절 가능" />
          </Card>
        </Section>

        {/* ─── 레이블 위치 ───────────────────────────────── */}
        <Section title="Label Position">
          <Card label="top (기본)" width="320px">
            <TextareaInput labelPosition="top" label="메모" rows={3} placeholder="입력" />
          </Card>
          <Card label="left" width="400px">
            <TextareaInput labelPosition="left" label="메모" labelWidth="4rem" rows={3} placeholder="입력" />
          </Card>
        </Section>

        {/* ─── 조합 예시 ─────────────────────────────────── */}
        <Section title="실제 사용 예시 — 공지사항 등록 폼">
          <div
            style={{
              width: '480px',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <TextInput label="제목" required placeholder="공지사항 제목을 입력하세요" />
            <TextareaInput
              label="내용"
              required
              rows={5}
              placeholder="공지사항 내용을 입력하세요"
              hint="최대 1000자까지 입력 가능합니다"
            />
          </div>
        </Section>

        <div className="input-guide-section-title">
          <h1 className="input-guide-section-title__heading">TextInput</h1>
        </div>

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
              leftIcon={<Icon id="i-mail" size={16} />}
            />
            <TextInput
              label="비밀번호"
              required
              type="password"
              showPasswordToggle
              size="lg"
              placeholder="비밀번호 입력"
              leftIcon={<Icon id="i-lock" size={16} />}
            />
          </div>
        </Section>
    </div>
  );
}
