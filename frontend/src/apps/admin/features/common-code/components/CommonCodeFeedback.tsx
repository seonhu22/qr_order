//src/apps/admin/features/common-code/components/CommonCodeFeedback.tsx
import { Icon } from '@/shared/assets/icons/Icon';

export const CommonCodeFeedback = () => {
  return (
    <section className="common-code-feedback" aria-live="polite" aria-label="상세코드 안내">
      <div className="common-code-feedback__icon-wrap" aria-hidden="true">
        <Icon id="i-info" size={20} className="common-code-feedback__icon" />
      </div>
      <p className="common-code-feedback__title">목록을 선택해주세요</p>
      <p className="common-code-feedback__description">
        위 목록에서 행을 클릭하면 상세 코드가 표시됩니다.
      </p>
    </section>
  );
};
