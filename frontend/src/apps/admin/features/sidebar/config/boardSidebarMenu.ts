export const BOARD_SIDEBAR_MENU = [
  {
    key: 'board',
    label: '게시판',
    groups: [
      {
        key: 'notice',
        label: '공지사항',
        items: [{ key: 'noticeManage', label: '공지사항 관리', path: '/admin/notice/manage' }],
      },
      {
        key: 'inquiry',
        label: '문의사항',
        items: [{ key: 'inquiryManage', label: '문의사항 관리', path: '/admin/inquiry/manage' }],
      },
    ],
  },
] as const;
