import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeHistoryTable } from './ChangeHistoryTable';

describe('ChangeHistoryTable', () => {
  it('renders file audit flags as readable labels', () => {
    render(
      <ChangeHistoryTable
        rows={[
          {
            id: 'change-1',
            auditFlag: 'FI',
            menuNm: '공지사항 관리',
            auditTrailContents: '첨부파일 등록',
            insertDatetime: '2026-05-06 10:00:00',
          },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText('파일 등록')).toBeInTheDocument();
    expect(screen.queryByText('FI')).not.toBeInTheDocument();
  });

  it('keeps base audit flag labels', () => {
    render(
      <ChangeHistoryTable
        rows={[
          {
            id: 'change-2',
            auditFlag: 'U',
            menuNm: '메뉴 관리',
            auditTrailContents: '메뉴명 수정',
            insertDatetime: '2026-05-06 11:00:00',
          },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText('수정')).toBeInTheDocument();
  });

  it('formats audit trail contents by line and label', () => {
    render(
      <ChangeHistoryTable
        rows={[
          {
            id: 'change-3',
            auditFlag: 'FI',
            menuNm: '공지사항 관리',
            auditTrailContents: [
              '신규 데이터',
              ' 순번: 1',
              ' 시스템id: 01KQFAWD8GP0XCBJMKNY7D9TDK',
              ' 파일 경로: /Users/seon/Documents/github/qr_order/uploads/BRD_NTC_MNG/2026/04',
            ].join('\n'),
            insertDatetime: '2026-05-06 12:00:00',
          },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText('신규 데이터')).toHaveClass('change-history-contents__title');
    expect(screen.getByText('순번')).toHaveClass('change-history-contents__label');
    expect(screen.getByText('1')).toHaveClass('change-history-contents__value');
    expect(screen.getByText('파일 경로')).toHaveClass('change-history-contents__label');
    expect(
      screen.getByText('/Users/seon/Documents/github/qr_order/uploads/BRD_NTC_MNG/2026/04'),
    ).toHaveClass('change-history-contents__value');
  });
});
