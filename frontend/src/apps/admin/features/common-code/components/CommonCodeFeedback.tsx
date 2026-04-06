/**
 * @fileoverview 공통코드 상세 비선택 상태 안내 UI
 *
 * @description
 * - 마스터를 아직 선택하지 않았을 때 상세 테이블 대신 보여주는 피드백 컴포넌트다.
 * - 사용자가 다음 액션을 이해할 수 있도록 최소 안내만 제공한다.
 */

import { Icon } from '@/shared/assets/icons/Icon';

/**
 * 상세 목록을 보기 위해 마스터를 먼저 선택하라는 안내를 렌더링한다.
 */
export const CommonCodeFeedback = () => {
  return (
    <section className="common-code-feedback" aria-live="polite" aria-label="상세코드 안내">
      <div className="common-code-feedback__icon-wrap" aria-hidden="true">
        <Icon id="i-feedback-pointer" size={22} className="common-code-feedback__icon" />
      </div>
      <p className="common-code-feedback__title">목록을 선택해주세요</p>
      <p className="common-code-feedback__description">
        위 목록에서 행을 클릭하면 상세 코드가 표시됩니다.
      </p>
    </section>
  );
};
