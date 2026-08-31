/**
 * @fileoverview Badge 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/badge)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/BadgeGuide
 */

import { Badge } from '@/shared/components/badge';
import {
  AuthorityBadge,
  ChangeTypeBadge,
  ExpirationStatusBadge,
  LicensePeriodBadge,
  UseYnBadge,
} from '@/shared/components/table/TableBadges';

/* =====================================================
 * 섹션 · 카드 헬퍼
 * ===================================================== */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dev-guide__section">
      <div className="dev-guide__section-header">
        <h2 className="dev-guide__section-title">{title}</h2>
        {description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      <div className="dev-guide__section-body">
        <div className="dev-guide__grid">{children}</div>
      </div>
    </section>
  );
}

function Card({
  label,
  note,
  children,
  width = 'auto',
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div style={{ width }}>
      <p className="dev-guide__item-label">{label}</p>
      {children}
      {note && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
          {note}
        </p>
      )}
    </div>
  );
}


/* =====================================================
 * 가이드 페이지 본체
 * ===================================================== */
export default function BadgeGuide() {
  return (
    <div className="dev-guide">

        {/* 헤더 */}
        <div className="dev-guide__header">
          <h1 className="dev-guide__title">Badge</h1>
          <p className="dev-guide__description">
            개발 전용 미리보기 · <code style={{ fontSize: '0.8rem' }}>/dev/badge</code>
          </p>
        </div>

        {/* ─── 톤(tone) ─────────────────────────────────── */}
        <Section
          title="Tone"
          description="알약형(pill)이 아니라 radius-sm(4px)의 살짝 둥근 사각형 — admin .status-badge, 참고 디자인의 rounded-[3px] 배지와 톤을 맞췄다."
        >
          <Card label="neutral (기본)" note="중립 톤 — 선택/복수선택처럼 강조가 필요 없는 라벨.">
            <Badge tone="neutral">선택</Badge>
          </Card>
          <Card label="brand" note="브랜드 강조 — 필수 표시처럼 눈에 띄어야 하는 라벨.">
            <Badge tone="brand">필수</Badge>
          </Card>
          <Card label="success" note="성공/완료 상태.">
            <Badge tone="success">완료</Badge>
          </Card>
          <Card label="warning" note="경고/대기 상태.">
            <Badge tone="warning">대기</Badge>
          </Card>
          <Card label="error" note="오류/품절처럼 부정적인 상태.">
            <Badge tone="error">품절</Badge>
          </Card>
        </Section>

        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size" description="sm은 테이블 셀처럼 조밀한 UI, md가 기본값이다.">
          <Card label="md (기본)">
            <Badge size="md">복수선택</Badge>
          </Card>
          <Card label="sm">
            <Badge size="sm">복수선택</Badge>
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ────────────────────────────── */}
        <Section
          title="실제 사용 예시 — 옵션 그룹 라벨"
          description="consumer 메뉴 상세 시트(MenuOptionGroupList)에서 실제로 쓰는 조합."
        >
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--typography-size-body)', fontWeight: 'var(--typography-weight-heading)' }}>
                밥 선택
              </span>
              <Badge tone="brand">필수</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--typography-size-body)', fontWeight: 'var(--typography-weight-heading)' }}>
                추가 선택
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge tone="neutral">복수선택</Badge>
                <Badge tone="neutral">선택</Badge>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── admin/client 테이블 리스트 배지 (.status-badge) ─────── */}
        <Section
          title="테이블 리스트 배지 — shared/components/table/TableBadges"
          description="admin/client 공용 테이블(TableCard)에서 쓰는 배지. 위 Badge와 별개 컴포넌트로, TableCard.css의 .status-badge 클래스를 그대로 쓴다 — 아직 이쪽으로 통합하지 않았다."
        >
          <Card label="사용여부 (UseYnBadge)" note="상태값(Y/N)에 따라 성공/중립 톤을 자동으로 분기한다.">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <UseYnBadge value="Y" />
              <UseYnBadge value="N" />
            </div>
          </Card>
          <Card
            label="권한 (AuthorityBadge)"
            note="code(백엔드 권한 코드, 01=관리자)로 톤을 정하고 label은 표시 텍스트로 별도 전달한다."
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <AuthorityBadge code="01" label="관리자" />
              <AuthorityBadge code="02" label="스태프" />
            </div>
          </Card>
          <Card
            label="변경구분 (ChangeTypeBadge)"
            note="등록=success / 수정=info / 삭제=error 톤."
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ChangeTypeBadge value="등록" />
              <ChangeTypeBadge value="수정" />
              <ChangeTypeBadge value="삭제" />
            </div>
          </Card>
          <Card
            label="만료 상태 (ExpirationStatusBadge)"
            note="만료=error / 미만료(-)=neutral 톤."
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ExpirationStatusBadge value="만료" />
              <ExpirationStatusBadge value="-" />
            </div>
          </Card>
          <Card
            label="라이선스 기간 (LicensePeriodBadge)"
            note="기간 구분일 뿐 상태 의미가 없어 둘 다 neutral 톤."
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <LicensePeriodBadge value="1개월" />
              <LicensePeriodBadge value="12개월" />
            </div>
          </Card>
        </Section>
    </div>
  );
}
