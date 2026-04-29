import {
  useGetNotice,
  useNewNotice,
  useUpdateNotice,
  useDelNotice,
} from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import type { NoticeResponse } from '@/generated/types/noticeResponse';
import type { NoticeManageRow } from '../types';

type NoticeResponseWithMeta = NoticeResponse & {
  sysId?: string;
  insertUserId?: string;
  insertDatetime?: string;
  modifyDatetime?: string;
};

export function mapToNoticeManageRow(res: NoticeResponseWithMeta, index: number): NoticeManageRow {
  const sysId = res.sysId ?? '';

  return {
    id: sysId || `notice-${index}-${res.noticeTitle ?? ''}-${res.startDate ?? ''}`,
    sysId,
    noticeType: 'notice',
    target: 'all',
    title: res.noticeTitle ?? '',
    content: res.noticeDescription ?? '',
    registrant: res.insertUserId ?? '',
    registeredAt: res.insertDatetime ?? res.startDate ?? '',
    updatedAt: res.modifyDatetime ?? '',
  };
}

export function useNoticeManageQuery(searchKeyword?: string) {
  const params = searchKeyword ? { searchKeyword } : {};
  return useGetNotice(params, {
    query: {
      queryKey: queryKeys.notice.list(searchKeyword ?? ''),
    },
  });
}

export function useCreateNoticeMutation() {
  return useNewNotice();
}

export function useUpdateNoticeMutation() {
  return useUpdateNotice();
}

export function useDeleteNoticesMutation() {
  return useDelNotice();
}
