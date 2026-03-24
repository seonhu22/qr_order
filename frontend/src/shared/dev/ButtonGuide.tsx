/**
 * @fileoverview Button 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/button)
 * - 10가지 변형 × 3가지 크기 × 7가지 상태 × LinkButton 예시
 *
 * @module dev/ButtonGuide
 */

import { useState } from 'react';
import { Button, LinkButton } from '@/shared/components/button';
import type { ButtonVariant, ButtonSize } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';


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
      overflow: 'hidden',
      marginBottom: '1rem',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border-divider)',
        background: 'var(--color-bg-muted)',
      }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </p>
        {desc && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
            {desc}
          </p>
        )}
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--color-border-divider)',
    }}>
      {label && (
        <p style={{
          fontSize: '0.6875rem',
          fontFamily: 'var(--typography-font-mono)',
          color: 'var(--color-text-tertiary)',
          marginBottom: '0.5rem',
        }}>
          {label}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        {children}
      </div>
    </div>
  );
}

function StateLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      {children}
      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{label}</span>
    </div>
  );
}


/* =====================================================
 * 가이드 페이지
 * ===================================================== */

export default function ButtonGuide() {
  const [toggleMap, setToggleMap] = useState<Record<string, boolean | string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setToggleMap((p) => ({ ...p, [key]: !p[key] }));

  const simulateLoad = (key: string) => {
    setLoading((p) => ({ ...p, [key]: true }));
    setTimeout(() => setLoading((p) => ({ ...p, [key]: false })), 2000);
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'var(--typography-font-base)' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 'var(--typography-size-h2)', fontWeight: 'var(--typography-weight-heading)', color: 'var(--color-text-primary)', margin: 0 }}>
          버튼 컴포넌트
        </h2>
        <p style={{ fontSize: 'var(--typography-size-ui)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
          3가지 사이즈 × 10가지 변형 × 7가지 상태의 버튼 컴포넌트 가이드
        </p>
      </div>

      {/* 사이즈 기준 */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-card)',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          사이즈 기준 (인풋 높이와 동일)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          {([
            { label: 'SM', height: '30px', use: '테이블 인라인 버튼' },
            { label: 'MD', height: '36px', use: '기본 폼 제출 ↔ Input MD' },
            { label: 'LG', height: '44px', use: '주요 CTA ↔ Input LG' },
          ]).map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--typography-font-mono)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-muted)',
                padding: '1px 8px',
                borderRadius: 'var(--radius-tag)',
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {s.height}
                <span style={{ color: 'var(--color-text-tertiary)', marginLeft: '0.5rem' }}>— {s.use}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. 변형(Type) ── */}
      <Section title="변형 (Variant)" desc="10가지 버튼 변형 — MD 사이즈 기준">
        <Row label="primary">
          <Button variant="primary" size="md">저장</Button>
          <Button variant="primary" size="md" leftIcon={<Icon id="i-plus" size={15} />}>신규 등록</Button>
          <Button variant="primary" size="md" rightIcon={<Icon id="i-arrow-right" size={15} />}>다음 단계</Button>
        </Row>
        <Row label="secondary">
          <Button variant="secondary" size="md">취소</Button>
          <Button variant="secondary" size="md" leftIcon={<Icon id="i-download" size={15} />}>내보내기</Button>
        </Row>
        <Row label="outline">
          <Button variant="outline" size="md">초기화</Button>
          <Button variant="outline" size="md" leftIcon={<Icon id="i-search" size={15} />}>조회</Button>
        </Row>
        <Row label="ghost">
          <Button variant="ghost" size="md">더 보기</Button>
          <Button variant="ghost" size="md" leftIcon={<Icon id="i-setting" size={15} />}>설정</Button>
        </Row>
        <Row label="danger">
          <Button variant="danger" size="md">삭제</Button>
          <Button variant="danger" size="md" leftIcon={<Icon id="i-trash" size={15} />}>전체 삭제</Button>
        </Row>
        <Row label="text">
          <Button variant="text" size="md">전체 보기</Button>
          <Button variant="text" size="md" rightIcon={<Icon id="i-arrow-right" size={15} />}>더 보기</Button>
        </Row>
        <Row label="link">
          <Button variant="link" size="md">비밀번호 찾기</Button>
          <Button variant="link" size="md">이용약관 보기</Button>
        </Row>
        <Row label="icon">
          <Button variant="icon" size="sm" iconOnly={<Icon id="i-search" size={13} />} />
          <Button variant="icon" size="md" iconOnly={<Icon id="i-bell" size={15} />} />
          <Button variant="icon" size="lg" iconOnly={<Icon id="i-setting" size={17} />} />
          <Button variant="icon" size="md" iconOnly={<Icon id="i-plus" size={15} />} style={{ color: 'var(--color-brand-default)' }} />
          <Button variant="icon" size="md" iconOnly={<Icon id="i-trash" size={15} />} style={{ color: 'var(--color-status-error-default)' }} />
        </Row>
        <Row label="icon-text">
          <Button variant="icon-text" size="md" leftIcon={<Icon id="i-qr" size={15} />}>QR 생성</Button>
          <Button variant="icon-text" size="md" leftIcon={<Icon id="i-plus" size={15} />}>추가</Button>
          <Button variant="icon-text" size="sm" leftIcon={<Icon id="i-save" size={13} />}>저장</Button>
        </Row>
        <Row label="toggle (클릭해보세요)">
          <Button
            variant="toggle"
            size="md"
            selected={!!toggleMap['t1']}
            onClick={() => toggle('t1')}
          >
            {toggleMap['t1'] ? '선택됨' : '선택'}
          </Button>
          <Button
            variant="toggle"
            size="md"
            selected={!toggleMap['theme']}
            onClick={() => setToggleMap((p) => ({ ...p, theme: false }))}
          >
            라이트
          </Button>
          <Button
            variant="toggle"
            size="md"
            selected={!!toggleMap['theme']}
            onClick={() => setToggleMap((p) => ({ ...p, theme: true }))}
          >
            다크
          </Button>
        </Row>
      </Section>

      {/* ── 2. 사이즈 비교 ── */}
      <Section title="사이즈 비교 (SM · MD · LG)" desc="주요 변형의 3가지 사이즈 비교">
        {(['primary', 'secondary', 'outline', 'danger'] as ButtonVariant[]).map((variant) => (
          <Row key={variant} label={variant}>
            {(['sm', 'md', 'lg'] as ButtonSize[]).map((size) => (
              <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Button variant={variant} size={size}>
                  {variant === 'primary' ? '저장' : variant === 'secondary' ? '취소' : variant === 'outline' ? '조회' : '삭제'}
                </Button>
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--typography-font-mono)' }}>
                  {size}
                </span>
              </div>
            ))}
          </Row>
        ))}
        <Row label="icon (정사각형)">
          {(['sm', 'md', 'lg'] as ButtonSize[]).map((size) => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Button variant="icon" size={size} iconOnly={<Icon id="i-bell" size={size === 'sm' ? 13 : size === 'md' ? 15 : 17} />} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--typography-font-mono)' }}>
                {size}
              </span>
            </div>
          ))}
        </Row>
      </Section>

      {/* ── 3. 상태 ── */}
      <Section title="상태 (State)" desc="7가지 버튼 상태 — primary MD 기준">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          <StateLabel label="default">
            <Button variant="primary" size="md">Default</Button>
          </StateLabel>
          <StateLabel label=":hover (직접 조작)">
            {/* 시뮬레이션 — 실제 hover CSS 상태는 직접 마우스를 올려야 함 */}
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 'var(--height-component-md)', padding: '0 var(--spacing-button-x-md)',
              fontSize: 'var(--typography-size-ui)', fontWeight: 'var(--typography-weight-ui)',
              fontFamily: 'var(--typography-font-base)', borderRadius: 'var(--radius-button)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-brand-hover)', color: 'var(--color-brand-text)',
            }}>
              Hover
            </button>
          </StateLabel>
          <StateLabel label=":active (직접 조작)">
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 'var(--height-component-md)', padding: '0 var(--spacing-button-x-md)',
              fontSize: 'var(--typography-size-ui)', fontWeight: 'var(--typography-weight-ui)',
              fontFamily: 'var(--typography-font-base)', borderRadius: 'var(--radius-button)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-brand-active)', color: 'var(--color-brand-text)',
            }}>
              Active
            </button>
          </StateLabel>
          <StateLabel label="focus-visible (Tab 키)">
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 'var(--height-component-md)', padding: '0 var(--spacing-button-x-md)',
              fontSize: 'var(--typography-size-ui)', fontWeight: 'var(--typography-weight-ui)',
              fontFamily: 'var(--typography-font-base)', borderRadius: 'var(--radius-button)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-brand-default)', color: 'var(--color-brand-text)',
              boxShadow: '0 0 0 3px var(--color-brand-focus-ring)', outline: 'none',
            }}>
              Focus
            </button>
          </StateLabel>
          <StateLabel label="disabled">
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </StateLabel>
          <StateLabel label="loading (클릭)">
            <Button
              variant="primary"
              size="md"
              loading={loading['demo']}
              onClick={() => simulateLoad('demo')}
            >
              {loading['demo'] ? '처리중...' : 'Loading →'}
            </Button>
          </StateLabel>
          <StateLabel label="selected (toggle)">
            <Button variant="toggle" size="md" selected>Selected</Button>
          </StateLabel>
          <StateLabel label="unselected (toggle)">
            <Button variant="toggle" size="md" selected={false}>Unselected</Button>
          </StateLabel>
        </div>

        {/* 전체 변형 disabled */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-divider)' }}>
          <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--typography-font-mono)', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
            disabled — 전체 변형
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as ButtonVariant[]).map((v) => (
              <Button key={v} variant={v} size="md" disabled>{v}</Button>
            ))}
          </div>
        </div>

        {/* 전체 변형 loading */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-divider)' }}>
          <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--typography-font-mono)', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
            loading — 전체 변형
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as ButtonVariant[]).map((v) => (
              <Button key={v} variant={v} size="md" loading>{v}</Button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 4. 토글 그룹 패턴 ── */}
      <Section title="토글 그룹 패턴" desc="icon + toggle 조합으로 셀렉터 구현">
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: '0 0 0.5rem' }}>보기 설정</p>
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
          {(['list', 'grid', 'card'] as const).map((val) => (
            <Button
              key={val}
              variant="toggle"
              size="sm"
              selected={
                toggleMap['view'] === undefined ? val === 'list' : toggleMap['view'] === val
              }
              onClick={() => setToggleMap((p) => ({ ...p, view: val }))}
            >
              {val === 'list' ? '리스트' : val === 'grid' ? '그리드' : '카드'}
            </Button>
          ))}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: '0 0 0.5rem' }}>테마 선택</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="toggle"
            size="md"
            selected={!toggleMap['darkMode']}
            onClick={() => setToggleMap((p) => ({ ...p, darkMode: false }))}
          >
            라이트
          </Button>
          <Button
            variant="toggle"
            size="md"
            selected={!!toggleMap['darkMode']}
            onClick={() => setToggleMap((p) => ({ ...p, darkMode: true }))}
          >
            다크
          </Button>
        </div>
      </Section>

      {/* ── 5. 실사용 조합 ── */}
      <Section title="실사용 조합 예시" desc="폼 하단, 모달 풋터, 테이블 액션, 검색 바">
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
          폼 제출 (우측 정렬)
        </p>
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
          border: '1px solid var(--color-border-divider)', borderRadius: 'var(--radius-button)',
          padding: '0.75rem', background: 'var(--color-bg-muted)', marginBottom: '1rem',
        }}>
          <Button variant="ghost" size="md">초기화</Button>
          <Button variant="secondary" size="md">임시저장</Button>
          <Button variant="primary" size="md" leftIcon={<Icon id="i-save" size={15} />}>저장</Button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
          모달 풋터
        </p>
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
          border: '1px solid var(--color-border-divider)', borderRadius: 'var(--radius-button)',
          padding: '0.75rem', background: 'var(--color-bg-muted)', marginBottom: '1rem',
        }}>
          <Button variant="ghost" size="md">취소</Button>
          <Button variant="danger" size="md" leftIcon={<Icon id="i-trash" size={15} />}>삭제</Button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
          테이블 인라인 아이콘 액션 (SM)
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          border: '1px solid var(--color-border-divider)', borderRadius: 'var(--radius-button)',
          padding: '0.75rem', background: 'var(--color-bg-muted)', marginBottom: '1rem',
        }}>
          <span style={{ fontSize: 'var(--typography-size-ui)', color: 'var(--color-text-primary)', flex: 1 }}>
            스마트버거 강남점
          </span>
          <Button variant="icon" size="sm" iconOnly={<Icon id="i-setting" size={13} />} />
          <Button variant="icon" size="sm" iconOnly={<Icon id="i-trash" size={13} />} style={{ color: 'var(--color-status-error-default)' }} />
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
          검색 바
        </p>
        <div style={{
          display: 'flex', gap: '0.5rem',
          border: '1px solid var(--color-border-divider)', borderRadius: 'var(--radius-button)',
          padding: '0.75rem', background: 'var(--color-bg-muted)',
        }}>
          <input
            style={{
              flex: 1, height: 'var(--height-component-md)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-button)',
              padding: '0 var(--spacing-input-x-md)',
              fontSize: 'var(--typography-size-ui)',
              fontFamily: 'var(--typography-font-base)',
              outline: 'none',
            }}
            placeholder="검색어 입력"
          />
          <Button variant="outline" size="md">초기화</Button>
          <Button variant="primary" size="md" leftIcon={<Icon id="i-search" size={15} />}>조회</Button>
        </div>
      </Section>

      {/* ── 6. LinkButton ── */}
      <Section
        title="링크 버튼 (LinkButton)"
        desc="<a> 태그 기반 버튼. target=_blank 시 외부 링크 아이콘 자동 표시"
      >
        <Row label="primary — 접속">
          <LinkButton variant="primary" size="sm" href="#" target="_blank">접속</LinkButton>
          <LinkButton variant="primary" size="md" href="#" target="_blank">접속</LinkButton>
          <LinkButton variant="primary" size="lg" href="#" target="_blank">접속</LinkButton>
        </Row>
        <Row label="outline — 미리보기 · 상세">
          <LinkButton variant="outline" size="sm" href="#" target="_blank">미리보기</LinkButton>
          <LinkButton variant="outline" size="md" href="#" target="_blank">미리보기</LinkButton>
          <LinkButton variant="outline" size="md" leftIcon={<Icon id="i-eye" size={15} />} href="#" target="_blank">상세 보기</LinkButton>
        </Row>
        <Row label="secondary · ghost · danger">
          <LinkButton variant="secondary" size="md" href="#" target="_blank">이동</LinkButton>
          <LinkButton variant="ghost" size="md" href="#" target="_blank">바로가기</LinkButton>
          <LinkButton variant="danger" size="md" href="#" target="_blank">강제 접속</LinkButton>
        </Row>
        <Row label="leftIcon 직접 지정">
          <LinkButton variant="primary" size="md" leftIcon={<Icon id="i-globe" size={15} />} href="#" target="_blank">사이트 접속</LinkButton>
          <LinkButton variant="outline" size="md" leftIcon={<Icon id="i-login" size={15} />} href="#">관리자 로그인</LinkButton>
        </Row>
        <Row label="disabled 상태">
          <LinkButton variant="primary" size="md" href="#" target="_blank" disabled>접속 (비활성)</LinkButton>
          <LinkButton variant="outline" size="md" href="#" target="_blank" disabled>미리보기 (비활성)</LinkButton>
        </Row>

        {/* 실사용 테이블 예시 */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-divider)' }}>
          <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--typography-font-mono)', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
            실사용 예시 — 테이블 행 내 접속 버튼
          </p>
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-button)', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 'var(--typography-size-ui)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border-default)' }}>
                  {['매장명', '도메인', '상태', '접속'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '스마트버거 강남점', domain: 'smartburger-gn.qrorder.kr', status: '운영중', ok: true },
                  { name: '더맛집 홍대점',   domain: 'thematjip-hd.qrorder.kr',   status: '점검중', ok: false },
                  { name: '카페인블루 신촌점', domain: 'cafeinblue-sc.qrorder.kr',  status: '운영중', ok: true },
                ].map((row) => (
                  <tr key={row.name} style={{ borderBottom: '1px solid var(--color-border-divider)' }}>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-primary)' }}>{row.name}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--typography-font-mono)' }}>
                      {row.domain}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 6px', borderRadius: 'var(--radius-tag)',
                        background: row.ok ? 'var(--color-status-success-bg)' : 'var(--color-status-warning-bg)',
                        color: row.ok ? 'var(--color-status-success-text)' : 'var(--color-status-warning-text)',
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <LinkButton
                        variant={row.ok ? 'primary' : 'outline'}
                        size="sm"
                        href={row.ok ? `https://${row.domain}` : undefined}
                        target="_blank"
                        disabled={!row.ok}
                      >
                        접속
                      </LinkButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
