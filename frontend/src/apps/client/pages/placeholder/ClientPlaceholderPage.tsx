import '@/apps/client/pages/placeholder/ClientPlaceholderPage.css';

type ClientPlaceholderPageProps = {
  title: string;
  description?: string;
};

export function ClientPlaceholderPage({ title, description }: ClientPlaceholderPageProps) {
  return (
    <section className="client-placeholder-page" aria-labelledby="client-placeholder-page-title">
      <header className="client-placeholder-page__header">
        <h1 id="client-placeholder-page-title" className="client-placeholder-page__title">
          {title}
        </h1>
        {description && <p className="client-placeholder-page__description">{description}</p>}
      </header>
      <div className="client-placeholder-page__body">
        <p className="client-placeholder-page__empty">화면 구현 예정입니다.</p>
      </div>
    </section>
  );
}
