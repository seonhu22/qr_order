import '@/apps/admin/pages/main/MainPage.css';
import { useQnaList } from '@/apps/admin/hooks/useQnaList';
import { FeedbackState } from '@/shared/components/feedback';

export function InquiryManagePage() {
  const { data, isLoading, isError } = useQnaList();

  return (
    <section className="admin-main-page" aria-labelledby="inquiry-manage-title">
      <header className="admin-main-page__header">
        <h1 id="inquiry-manage-title" className="admin-main-page__title">
          문의사항 관리
        </h1>
      </header>

      <div className="admin-main-page__canvas">
        <div className="admin-main-page__placeholder">
          {isLoading && (
            <FeedbackState variant="loading" title="문의사항을 불러오는 중입니다." />
          )}
          {isError && (
            <p className="admin-main-page__placeholder-copy">
              문의사항을 불러오지 못했습니다
            </p>
          )}
          {!isLoading && !isError && (
            <p className="admin-main-page__placeholder-copy">
              총 {data?.length ?? 0}건의 문의사항이 있습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
