import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { NotFoundPage } from '@/shared/pages/error';

type RejectUnexpectedSearchParamsProps = {
  children: ReactNode;
};

export function RejectUnexpectedSearchParams({ children }: RejectUnexpectedSearchParamsProps) {
  const location = useLocation();

  if (location.search) {
    return <NotFoundPage homePath="/admin/main" />;
  }

  return children;
}
