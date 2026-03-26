/**
 * @fileoverview FormAlert 컴포넌트 개발 가이드 페이지
 *
 * @description
 * - 로컬 개발 전용 미리보기 페이지 (/dev/form-alert)
 * - 프로덕션 빌드에 포함되지 않도록 라우트 등록 시 주의
 *
 * @module dev/FormAlertGuide
 */

import { useState } from 'react';
import { FormAlert, DismissibleFormAlert } from '@/shared/components/form-alert';
import './devStyles/FormAlertGuide.css';

/* =====================================================
 * 섹션 헬퍼
 * ===================================================== */
function Section({
  title,
  children,
  row = false,
}: {
  title: string;
  children: React.ReactNode;
  row?: boolean;
}) {
  return (
    <section className="form-alert-guide__section">
      <h2 className="form-alert-guide__section-title">{title}</h2>
      <div className={['form-alert-guide__section-body', row ? 'form-alert-guide__section-body--row' : ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-alert-guide__card">
      <p className="form-alert-guide__card-label">{label}</p>
      {children}
    </div>
  );
}


/* =====================================================
 * 가이드 페이지 본체
 * ===================================================== */
export default function FormAlertGuide() {
  const [submitState, setSubmitState] = useState<'idle' | 'error' | 'success'>('idle');

  return (
    <div className="form-alert-guide">
      <div className="form-alert-guide__container">

        {/* 헤더 */}
        <div className="form-alert-guide__header">
          <h1 className="form-alert-guide__title">FormAlert</h1>
          <p className="form-alert-guide__subtitle">
            개발 전용 미리보기 · <code>/dev/form-alert</code>
          </p>
        </div>

        {/* ─── 유형 (Type) ────────────────────────────── */}
        <Section title="Type">
          <Card label="error — 에러·실패·위험">
            <FormAlert type="error" title="입력 내용을 확인해주세요" dismissible={false} />
          </Card>
          <Card label="info — 안내·참고">
            <FormAlert type="info" title="변경 사항은 저장 후 반영됩니다" dismissible={false} />
          </Card>
          <Card label="guide — 가이드·팁">
            <FormAlert type="guide" title="작성 팁" dismissible={false} />
          </Card>
          <Card label="success — 성공·완료">
            <FormAlert type="success" title="저장이 완료되었습니다" dismissible={false} />
          </Card>
        </Section>

        {/* ─── 콘텐츠 조합 ─────────────────────────────── */}
        <Section title="Content Combination">
          <Card label="title만">
            <FormAlert type="error" title="요청을 처리할 수 없습니다" dismissible={false} />
          </Card>
          <Card label="description만">
            <FormAlert type="info" description="세션이 30분 후 만료됩니다." dismissible={false} />
          </Card>
          <Card label="title + description">
            <FormAlert
              type="guide"
              title="메뉴 이름 작성 안내"
              description="고객 앱에 표시되는 이름입니다. 간결하고 명확하게 입력해주세요."
              dismissible={false}
            />
          </Card>
          <Card label="title + errors 목록">
            <FormAlert
              type="error"
              title="다음 항목을 확인해주세요"
              errors={[
                '이메일 형식이 올바르지 않습니다',
                '비밀번호는 8자 이상이어야 합니다',
                '전화번호를 입력해주세요',
              ]}
              dismissible={false}
            />
          </Card>
          <Card label="title + description + errors">
            <FormAlert
              type="error"
              title="회원가입 실패"
              description="아래 항목을 수정 후 다시 시도해주세요."
              errors={['이미 사용 중인 이메일입니다', '비밀번호 확인이 일치하지 않습니다']}
              dismissible={false}
            />
          </Card>
        </Section>

        {/* ─── 닫기 버튼 ───────────────────────────────── */}
        <Section title="Dismissible">
          <Card label="dismissible=true (기본) — 버튼 클릭 시 콘솔 출력">
            <FormAlert
              type="error"
              title="서버 오류가 발생했습니다"
              description="잠시 후 다시 시도해주세요."
              onDismiss={() => console.log('FormAlert dismissed')}
            />
          </Card>
          <Card label="dismissible=false — 닫기 버튼 없음">
            <FormAlert
              type="success"
              title="비밀번호가 변경되었습니다"
              dismissible={false}
            />
          </Card>
        </Section>

        {/* ─── DismissibleFormAlert ────────────────────── */}
        <Section title="DismissibleFormAlert (자체 상태 관리)">
          <Card label="defaultShow=true — 닫기 클릭 시 완전히 사라짐">
            <DismissibleFormAlert
              type="info"
              title="공지사항"
              description="정기 점검 안내: 매주 화요일 02:00 – 04:00에 서비스가 일시 중단됩니다."
            />
          </Card>
          <Card label="guide 유형">
            <DismissibleFormAlert
              type="guide"
              title="사진 업로드 안내"
              description="권장 비율 1:1, 최대 5MB, JPG·PNG 형식만 지원합니다."
            />
          </Card>
        </Section>

        {/* ─── 실제 사용 예시 ──────────────────────────── */}
        <Section title="실제 사용 예시 — 로그인 폼">
          <div className="form-alert-guide__form-card">
            <p className="form-alert-guide__form-title">로그인</p>

            {/* 에러 알림 */}
            {submitState === 'error' && (
              <FormAlert
                type="error"
                title="로그인에 실패했습니다"
                errors={['이메일 또는 비밀번호를 확인해주세요']}
                onDismiss={() => setSubmitState('idle')}
              />
            )}

            {/* 성공 알림 */}
            {submitState === 'success' && (
              <FormAlert
                type="success"
                title="로그인 성공"
                description="잠시 후 메인 화면으로 이동합니다."
                dismissible={false}
              />
            )}

            <div className="form-alert-guide__form-field">
              <label className="form-alert-guide__form-label">이메일</label>
              <input
                type="email"
                className={[
                  'form-alert-guide__form-input',
                  submitState === 'error' ? 'form-alert-guide__form-input--error' : '',
                ].filter(Boolean).join(' ')}
                placeholder="example@email.com"
              />
            </div>

            <div className="form-alert-guide__form-field">
              <label className="form-alert-guide__form-label">비밀번호</label>
              <input
                type="password"
                className={[
                  'form-alert-guide__form-input',
                  submitState === 'error' ? 'form-alert-guide__form-input--error' : '',
                ].filter(Boolean).join(' ')}
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div className="form-alert-guide__form-actions">
              <button
                type="button"
                className="form-alert-guide__form-submit form-alert-guide__form-submit--flex"
                onClick={() => setSubmitState('error')}
              >
                실패 시뮬레이션
              </button>
              <button
                type="button"
                className="form-alert-guide__form-submit form-alert-guide__form-submit--success"
                onClick={() => setSubmitState('success')}
              >
                성공 시뮬레이션
              </button>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}