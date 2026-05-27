/**
 * @fileoverview ToggleInput 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/toggle)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/ToggleGuide
 */

import { useState } from 'react';
import { ToggleInput } from '@/shared/components/toggle';
import './devStyles/ToggleGuide.css';

/* =====================================================
 * 섹션 · 카드 헬퍼
 * ===================================================== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="toggle-guide__section">
      <h2 className="toggle-guide__section-title">{title}</h2>
      <div className="toggle-guide__section-body">{children}</div>
    </section>
  );
}

function Card({
  label,
  children,
  width,
}: {
  label: string;
  children: React.ReactNode;
  width?: '180' | '200' | '240' | '300' | '400';
}) {
  const widthClass = width ? `toggle-guide__card--w${width}` : '';
  return (
    <div className={['toggle-guide__card', widthClass].filter(Boolean).join(' ')}>
      <p className="toggle-guide__card-label">{label}</p>
      {children}
    </div>
  );
}


/* =====================================================
 * 가이드 페이지 본체
 * ===================================================== */
export default function ToggleGuide() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [autoSave, setAutoSave]           = useState(true);

  return (
    <div className="toggle-guide">
      <div className="toggle-guide__container">

        {/* 헤더 */}
        <div className="toggle-guide__header">
          <h1 className="toggle-guide__title">ToggleInput</h1>
          <p className="toggle-guide__subtitle">
            개발 전용 미리보기 · <code>/dev/toggle</code>
          </p>
        </div>

        {/* ─── 크기 ─────────────────────────────────────── */}
        <Section title="Size">
          <Card label="sm (32×24px)">
            <ToggleInput size="sm" defaultChecked />
          </Card>
          <Card label="md (40×28px) — 기본">
            <ToggleInput size="md" defaultChecked />
          </Card>
          <Card label="lg (44×30px)">
            <ToggleInput size="lg" defaultChecked />
          </Card>
        </Section>

        {/* ─── 상태 ─────────────────────────────────────── */}
        <Section title="State">
          <Card label="OFF (기본)">
            <ToggleInput />
          </Card>
          <Card label="ON">
            <ToggleInput defaultChecked />
          </Card>
          <Card label="disabled (OFF)">
            <ToggleInput disabled />
          </Card>
          <Card label="disabled (ON)">
            <ToggleInput disabled defaultChecked />
          </Card>
          <Card label="loading (OFF)">
            <ToggleInput loading />
          </Card>
          <Card label="loading (ON)">
            <ToggleInput loading defaultChecked />
          </Card>
        </Section>

        {/* ─── 레이블 위치 ───────────────────────────────── */}
        <Section title="Label Position">
          <Card label="right (기본)" width="200">
            <ToggleInput label="알림 수신" defaultChecked />
          </Card>
          <Card label="left" width="200">
            <ToggleInput label="다크 모드" labelPosition="left" />
          </Card>
          <Card label="hint 포함 — right" width="240">
            <ToggleInput
              label="자동 저장"
              hint="변경 사항을 자동으로 저장합니다"
              defaultChecked
            />
          </Card>
          <Card label="hint 포함 — left" width="240">
            <ToggleInput
              label="마케팅 수신 동의"
              hint="언제든지 변경 가능합니다"
              labelPosition="left"
            />
          </Card>
        </Section>

        {/* ─── 크기 × 레이블 조합 ────────────────────────── */}
        <Section title="Size × Label">
          <Card label="sm" width="180">
            <ToggleInput size="sm" label="소형 토글" defaultChecked />
          </Card>
          <Card label="md" width="180">
            <ToggleInput size="md" label="중형 토글" defaultChecked />
          </Card>
          <Card label="lg" width="180">
            <ToggleInput size="lg" label="대형 토글" defaultChecked />
          </Card>
        </Section>

        {/* ─── 제어 컴포넌트 ─────────────────────────────── */}
        <Section title="Controlled (onChange)">
          <Card label="외부 상태 연동" width="300">
            <div className="toggle-guide__control-list">
              <ToggleInput
                label="알림 수신"
                hint="주문·배달 상태 알림"
                checked={notifications}
                onChange={setNotifications}
              />
              <ToggleInput
                label="다크 모드"
                hint="앱 전체 테마 변경"
                checked={darkMode}
                onChange={setDarkMode}
              />
              <ToggleInput
                label="자동 저장"
                hint="30초마다 자동 저장"
                checked={autoSave}
                onChange={setAutoSave}
              />
            </div>
            <div className="toggle-guide__control-result">
              알림:{' '}
              <strong className="toggle-guide__control-value">
                {notifications ? 'ON' : 'OFF'}
              </strong>
              {' · '}
              다크모드:{' '}
              <strong className="toggle-guide__control-value">
                {darkMode ? 'ON' : 'OFF'}
              </strong>
              {' · '}
              자동저장:{' '}
              <strong className="toggle-guide__control-value">
                {autoSave ? 'ON' : 'OFF'}
              </strong>
            </div>
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ────────────────────────────── */}
        <Section title="실제 사용 예시 — 설정 화면">
          <div className="toggle-guide__settings-card">
            <div className="toggle-guide__settings-header">
              <p className="toggle-guide__settings-header-title">알림 설정</p>
            </div>
            {[
              { label: '주문 완료 알림',   hint: '주문이 접수되면 알림을 보냅니다', on: true  },
              { label: '배달 상태 알림',   hint: '배달 단계별 실시간 알림',          on: true  },
              { label: '마케팅 수신 동의', hint: '이벤트·쿠폰 등 혜택 안내',          on: false },
              { label: '야간 알림 허용',   hint: '22:00 – 08:00 시간대 포함',         on: false },
            ].map((item) => (
              <div key={item.label} className="toggle-guide__settings-row">
                <div className="toggle-guide__settings-row-text">
                  <p className="toggle-guide__settings-row-label">{item.label}</p>
                  <p className="toggle-guide__settings-row-hint">{item.hint}</p>
                </div>
                <ToggleInput defaultChecked={item.on} />
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}